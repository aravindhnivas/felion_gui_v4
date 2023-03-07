<script lang="ts">
    import { isEmpty } from 'lodash-es'
    import Colors from '$lib/misc/colors'
    import computePy_func from '$lib/pyserver/computePy'
    import ButtonBadge from '$src/components/ButtonBadge.svelte'
    import { kinetics_filenames } from '$src/Pages/timescan/stores'
    import { Textfield, SeparateWindow, Select, Checkbox, Badge } from '$src/components'
    import TextAndSelectOptsToggler from '$src/components/TextAndSelectOptsToggler.svelte'
    import FileListsModal from './FileListsModal.svelte'

    export let active = false
    export let configDir: string = ''

    let graph_plotted = { number_densities: false, temperature: false }
    let full_data = {}
    let data_loaded = false
    let parameters: {
        labels: string[]
        fileCollections: { name: string; selected: boolean }[]
    } = {
        labels: [],
        fileCollections: [],
    }
    let temperature_values = []
    let processed_dir = ''
    const processed_filename = persistentWritable('processed_filename', 'kinetics.processed.json')
    $: processed_params_filename = $processed_filename.split('.')[0] + '.params.processed.json'

    let file_available = {
        processed: false,
        rateConstants: false,
    }

    const check_processed_file = async (filename: string) => {
        const filePath = await path.join(processed_dir, filename)
        return await fs.exists(filePath)
    }

    let processed_rateConstants_filename = {
        fitted: 'kinetics.rateConstants.fitted.json',
        processed: 'kinetics.rateConstants.processed.json',
    }
    let rate_constant_filename = ''

    onMount(async () => {
        await update_dir(configDir)
        file_available.processed = await check_processed_file($processed_filename)

        if ($autoChangeName) {
            const firstName = $processed_filename.split('.')[0]
            processed_rateConstants_filename.fitted = firstName + '.rateConstants.fitted.json'
            processed_rateConstants_filename.processed = firstName + '.rateConstants.processed.json'
        }
        rate_constant_filename = processed_rateConstants_filename.processed
        file_available.rateConstants = await check_processed_file(rate_constant_filename)
    })

    let rate_constant_values: {
        fitted: KineticsPlot.RateConstantFitted
        processed: KineticsPlot.RateConstantProcessed
    } = {
        processed: {},
        fitted: {},
    }

    const update_dir = async (dir: string) => {
        if (!dir) return
        processed_dir = await path.join(dir, 'processed')
    }
    $: update_dir(configDir)
    let number_densities = { val: [], std: [] }
    let fitted_values = { val: [], std: [] }

    const f_ND_plot_ID = 'kinetic_plot_f_ND_rate'

    const plot_number_density = async () => {
        const data_set = await set_data()
        if (!data_set) return
        graph_plotted.number_densities = false

        const data_rate: Partial<Plotly.PlotData> = {
            x: number_densities.val,
            y: fitted_values.val,
            'marker.color': `rgb${Colors[0]}`,
            error_y: {
                type: 'data',
                array: fitted_values.std,
                visible: true,
            },
            error_x: {
                type: 'data',
                array: number_densities.std,
                visible: true,
            },
            type: 'scatter',
            mode: 'markers',
            name: `${temperature} K`,
            showlegend: true,
        }

        const layout_rate: Partial<Plotly.Layout> = {
            title: `${rate_coefficient_label} as a function of number density`,
            xaxis: { title: 'number density [cm <sup>-3</sup>]', tickformat: '.0e' },
            yaxis: { title: `${rate_coefficient_label} [s <sup>-1</sup>]` },
        }
        react(f_ND_plot_ID, [data_rate], layout_rate)
        graph_plotted.number_densities = true
        if (!polyOrder) return
        await compute_rate_constant()
        plot_rate_constant()

        file_available.rateConstants = await check_processed_file(rate_constant_filename)
    }

    let rate_constant_data_loaded = false
    let weighted_mean = ''

    const compute_rate_constant = async () => {
        if (!graph_plotted.number_densities) return await dialog.message('Please plot the number density first')
        if (!polyOrder) return await dialog.message('Please enter a polynomial order')

        rate_constant_data_loaded = false
        const dataFromPython: void | {
            rate_constant: { val: number[]; std: number[]; mean: string; weighted_mean: string }
        } = await computePy_func({
            pyfile: 'kineticsCode.fit_rates',
            args: {
                fit: false,
                polyOrder,
                fitted_values,
                number_densities,
            },
        })

        if (!dataFromPython) return
        if (!rate_constant_values.processed[temperature]) rate_constant_values.processed[temperature] = {}
        const current_temp_rate_constants = dataFromPython.rate_constant

        rate_constant_values.processed[temperature][rate_coefficient_label] = {
            ...current_temp_rate_constants,
            number_densities,
        }

        weighted_mean = current_temp_rate_constants.weighted_mean
        rate_constant_data_loaded = true
    }

    const plot_rate_constant = () => {
        const current_temp_rate_constants = rate_constant_values.processed[temperature][rate_coefficient_label]

        const data_rate_constant: Partial<Plotly.PlotData> = {
            x: current_temp_rate_constants.number_densities.val,
            y: current_temp_rate_constants.val,
            'marker.color': `rgb${Colors[0]}`,
            error_y: {
                type: 'data',
                array: current_temp_rate_constants.std,
                visible: true,
            },
            error_x: {
                type: 'data',
                array: current_temp_rate_constants.number_densities.std,
                visible: true,
            },
            type: 'scatter',
            mode: 'markers',
            name: `${temperature} K`,
            showlegend: true,
        }
        const layout_rate_constant: Partial<Plotly.Layout> = {
            title: `${rate_coefficient_label} as a function of number density (constant)`,
            xaxis: { title: 'number density [cm <sup>-3</sup>]', tickformat: '.0e' },
            yaxis: {
                title: `${rate_coefficient_label} [s <sup>-1</sup> cm <sup>${3 * polyOrder}</sup>]`,
                tickformat: '.0e',
            },
        }

        react(`${f_ND_plot_ID}_rateconstant`, [data_rate_constant], layout_rate_constant)
    }

    const set_data = async () => {
        if (!data_loaded) return false

        if (!temperature) {
            await dialog.message('Invalid temperature.', { type: 'error' })
            return false
        }
        if (!rate_coefficient_label) {
            await dialog.message('Invalid rate coefficient.', { type: 'error' })
            return false
        }

        try {
            const current_data = full_data[temperature]
            const ND_keys = Object.keys(current_data)
            const Number_densities = { val: [], std: [] }
            const Fitted_values = { val: [], std: [] }

            ND_keys.forEach((nd) => {
                if (!current_data[nd][rate_coefficient_label]) return
                const ND_val = get_nominal_value(nd)
                const ND_std = get_std_value(nd)
                Number_densities.val = [...Number_densities.val, ND_val]
                Number_densities.std = [...Number_densities.std, ND_std]

                Fitted_values.val = [...Fitted_values.val, current_data[nd][rate_coefficient_label].val]
                Fitted_values.std = [...Fitted_values.std, current_data[nd][rate_coefficient_label].std]
            })
            const sorted = Number_densities.val.map((val, index) => [val, index]).sort((a, b) => a[0] - b[0])
            const sorted_indices = sorted.map((val) => val[1])

            Number_densities.val = sorted_indices.map((index) => Number_densities.val[index])
            Number_densities.std = sorted_indices.map((index) => Number_densities.std[index])
            Fitted_values.val = sorted_indices.map((index) => Fitted_values.val[index])
            Fitted_values.std = sorted_indices.map((index) => Fitted_values.std[index])

            if (!Fitted_values.val.length) return

            number_densities = Number_densities
            fitted_values = Fitted_values
            return true
        } catch (error) {
            if (error instanceof Error) window.handleError(error)
        }
    }

    const load_data = async () => {
        const processed_file = await path.join(processed_dir, $processed_filename)
        if (!(await fs.exists(processed_file))) {
            await dialog.message(`${processed_file} does not exist`, { type: 'error' })
            return
        }

        const [_err1, data] = await oO(fs.readTextFile(processed_file))
        if (_err1) return await dialog.message(`Error reading file ${processed_file}`, { type: 'error' })

        full_data = JSON.parse(data)
        temperature_values = Object.keys(full_data)
        window.createToast(`${$processed_filename} loaded`, 'success')

        const processed_params_file = await path.join(processed_dir, processed_params_filename)
        const [_err2, params] = await oO(fs.readTextFile(processed_params_file))

        if (_err2) {
            await dialog.message(`Error reading file ${processed_params_filename}`, {
                type: 'error',
            })
            return
        }

        parameters = JSON.parse(params)
        fileCollections = parameters.fileCollections

        window.createToast(`${processed_params_filename} loaded`, 'success')
        data_loaded = true
        console.log('full_data', full_data)
        if (temperature && rate_coefficient_label) plot_number_density()
    }

    let config_data = {}
    let fit_data = {}

    let fileCollections: { name: string; selected: boolean }[] = []
    $: selected_file_length = fileCollections.filter((file) => file.selected).length

    const load_data_for_processing = async ({ toast = true } = {}) => {
        if (!(await fs.exists(configDir))) return await dialog.message('No config directory found')

        fit_data = await parse_file({ filename: $kinetics_filenames.fit })
        config_data = await parse_file({ filename: $kinetics_filenames.configs })
        fileCollections = Object.keys(fit_data).map((name) => ({ name, selected: true }))
        fileCollections.forEach((file) => {
            if (!fit_data[file.name]['tag']) return
            const keys = Object.keys(fit_data[file.name]['tag'])
            keys.forEach((key) => {
                if (!tagOpts.includes(key)) tagOpts = [...tagOpts, key]
            })
        })
        if (toast) window.createToast('Filelists loaded', 'success')
    }

    let processed_full_data = {}
    let tagOpts = ['default']
    let tag = 'default'

    const process_data = async ({ toast = true } = {}) => {
        if (!fileCollections.length) return await dialog.message('No filelists loaded')

        let rate_paramters = { forwards: [], backwards: [] }
        // let processed_filelists: { name: string; selected: boolean }[] = []

        // let counter = -1
        // for (const filelist of fileCollections) {
        fileCollections.forEach((filelist, ind) => {
            // counter++
            if (!filelist.selected) return
            const filename = filelist.name
            if (!config_data[filename]) return

            const current_data = tag === 'default' ? fit_data[filename]?.[tag] : fit_data[filename]?.tag?.[tag]
            // processed_filelists = [...processed_filelists, { name: filename, selected: current_data ? true : false }]
            if (!current_data) {
                fileCollections[ind].selected = false
                return
            }

            Object.keys(current_data['k3_fit']).forEach((key) => {
                if (!rate_paramters.forwards.includes(key)) rate_paramters.forwards = [...rate_paramters.forwards, key]
            })

            Object.keys(current_data['kCID_fit']).forEach((key) => {
                if (!rate_paramters.backwards.includes(key))
                    rate_paramters.backwards = [...rate_paramters.backwards, key]
            })

            const { temp, ND } = config_data[filename]
            if (!processed_full_data[temp]) processed_full_data[temp] = {}

            rate_paramters.forwards.forEach((key) => {
                if (!processed_full_data[temp][ND]) processed_full_data[temp][ND] = {}

                const fit_val = current_data['k3_fit'][key]
                if (!fit_val) return
                const [fitted_val, fitted_val_std] = fit_val
                if (!processed_full_data[temp][ND][key]) processed_full_data[temp][ND][key] = { val: null, std: null }
                processed_full_data[temp][ND][key].val = fitted_val
                processed_full_data[temp][ND][key].std = fitted_val_std
            })

            rate_paramters.backwards.forEach((key) => {
                if (!processed_full_data[temp][ND]) processed_full_data[temp][ND] = {}
                const fit_val = current_data['kCID_fit'][key]
                if (!fit_val) return
                const [fitted_val, fitted_val_std] = fit_val
                if (!processed_full_data[temp][ND][key]) processed_full_data[temp][ND][key] = { val: null, std: null }
                processed_full_data[temp][ND][key].val = fitted_val
                processed_full_data[temp][ND][key].std = fitted_val_std
            })
        })
        console.log({ fileCollections })
        // fileCollections = structuredClone(processed_filelists)
        // console.log({ fileCollections })
        parameters = {
            labels: [...rate_paramters.forwards, ...rate_paramters.backwards],
            fileCollections,
        }
        console.log({ parameters, fileCollections })

        if (toast) window.createToast('Data processed and loaded', 'success')
    }

    const parse_file = async ({ filename, loc = null, toast = true }) => {
        const fullpath = await path.join(loc ?? configDir, filename)
        if (!(await fs.exists(fullpath))) {
            if (toast) await dialog.message(`File ${filename} does not exist in ${configDir}`)
            return {}
        }
        const filename_data = await fs.readTextFile(fullpath)
        const filename_json = JSON.parse(filename_data)
        return filename_json
    }

    let temperature = ''
    let rate_coefficient_label = ''

    const saved_filenames = ['configs', 'fit']

    const save_data = async () => {
        if (isEmpty(processed_full_data)) return await dialog.message('No data to save', { type: 'error' })
        if (!(await fs.exists(processed_dir))) await fs.createDir(processed_dir)

        const processed_file = await path.join(processed_dir, $processed_filename)
        const [err1] = await oO(fs.writeTextFile(processed_file, JSON.stringify(processed_full_data, null, 4)))
        if (err1) return await dialog.message(`Error saving file ${processed_file}`)

        window.createToast(`Saved file ${$processed_filename}`, 'success')

        const processed_params_file = await path.join(processed_dir, processed_params_filename)
        const [err2] = await oO(fs.writeTextFile(processed_params_file, JSON.stringify(parameters, null, 4)))
        if (err2) return await dialog.message(`Error saving file ${processed_params_filename}`)
        window.createToast(`Saved file ${processed_params_filename}`, 'success')
        file_available.processed = await check_processed_file($processed_filename)
    }

    let rate_constant_mean_value_type = 'weighted_mean'
    $: rate_constant_mean_value_type_options = rate_constant_filename.endsWith('processed.json')
        ? ['weighted_mean']
        : ['slope', 'intercept']

    let hide_header = false
    let addIntercept = true
    let polyOrder = ''
    let polyOrderRateConstant = 1
    let effective_rate_polyOrder = 1
    let fitted_intercept = ''
    let fitted_slope = ''
    const intercept_guess = persistentWritable('kinetics_intercept_guess', 0)
    const rate_constant_guess = persistentWritable('kinetics_rate_constant_guess', 1e-30)

    async function derive_rate_constant(e: Event) {
        if (!graph_plotted.number_densities) return await dialog.message('No data to fit', { type: 'error' })
        if (!fitted_values.val.length) return await dialog.message('No data to fit', { type: 'error' })

        const pyfile = 'kineticsCode.fit_rates'
        const args = {
            fit: true,
            polyOrder: polyOrderRateConstant,
            addIntercept,
            fitted_values,
            number_densities,
            $intercept_guess,
            $rate_constant_guess,
            effective_rate_polyOrder,
        }

        const dataFromPython: void | {
            fitted_intercept: string
            fitted_slope: string
            fitY: number[]
            fitX: number[]
            ke: {
                val: number[]
                std: number[]
            }
        } = await computePy_func({ e, pyfile, args })
        if (!dataFromPython) return

        const { fitY, fitX, ke } = dataFromPython
        ;({ fitted_intercept, fitted_slope } = dataFromPython)

        const data_rate_constant: Partial<Plotly.PlotData> = {
            x: fitX,
            y: fitY,
            line: { color: `rgb${Colors[0]}` },
            type: 'scatter',
            mode: 'lines',
            name: `${temperature} K`,
            showlegend: false,
        }

        const data_effective_rate_constant: Partial<Plotly.PlotData> = {
            x: number_densities.val,
            y: ke.val,
            error_y: {
                type: 'data',
                array: ke.std,
                visible: true,
                color: `rgb${Colors[0]}`,
            },
            error_x: {
                type: 'data',
                array: number_densities.std,
                visible: true,
                color: `rgb${Colors[0]}`,
            },
            marker: { color: `rgb${Colors[0]}` },
            type: 'scatter',
            mode: 'markers',
            name: `${temperature} K`,
            showlegend: false,
        }

        const layout_rate_constant: Partial<Plotly.Layout> = {
            title: `${rate_coefficient_label} effective rate constant as a function of number density at ${temperature} K`,
            xaxis: { title: 'number density [cm <sup>-3</sup>]', tickformat: '.0e' },
            yaxis: {
                title: `${rate_coefficient_label} [s <sup>-1</sup> cm <sup>${3 * effective_rate_polyOrder}</sup>]`,
                tickformat: '.0e',
            },
        }

        // const raw_data = document.getElementById(f_ND_plot_ID)?.data ?? []
        const data = [data_effective_rate_constant, data_rate_constant]
        react(`${f_ND_plot_ID}_effective_rateconstant`, data, layout_rate_constant)

        // window.createToast(`Fitted ${rate_coefficient_label} as a function of number density`, 'success')

        if (!rate_constant_values.fitted[temperature]) rate_constant_values.fitted[temperature] = {}
        rate_constant_values.fitted[temperature][rate_coefficient_label] = {
            ke,
            fitX,
            fitY,
            number_densities,
            slope: fitted_slope,
            intercept: fitted_intercept,
        }
    }

    const save_rate_constants = async (type: 'processed' | 'fitted') => {
        if (isEmpty(rate_constant_values[type])) return await dialog.message('No data to save', { type: 'error' })

        let current_rate_constants = {}
        const filename = processed_rateConstants_filename[type]
        const processed_file = await path.join(processed_dir, filename)
        if (await fs.exists(processed_file)) {
            current_rate_constants = await parse_file({
                filename,
                loc: processed_dir,
            })
        }

        current_rate_constants = { ...current_rate_constants, ...rate_constant_values[type] }
        if (!(await fs.exists(processed_dir))) await fs.createDir(processed_dir)

        const [err1] = await oO(fs.writeTextFile(processed_file, JSON.stringify(current_rate_constants, null, 4)))
        if (err1) return await dialog.message(`Error saving file ${processed_file}`)

        window.createToast(`Saved file ${filename}`, 'success')
        file_available.rateConstants = true
        type === 'processed' ? save_fn_of_ND_to_txt_file() : save_effective_ke_to_txt_file()
    }

    let temp_rate_constants = {}
    let rate_constant_file_loaded = false
    let filelists_selection_modal_active = false

    const load_temp_rate_constants = async () => {
        const processed_file = await path.join(processed_dir, rate_constant_filename)
        if (!(await fs.exists(processed_file))) {
            return await dialog.message(`${rate_constant_filename} file doesn't exists`, { type: 'error' })
        }

        const [err, content] = await oO(fs.readTextFile(processed_file))

        if (err) return await dialog.message(`Error reading file ${processed_file}`, { type: 'error' })
        temp_rate_constants = JSON.parse(content)
        parameters.labels = Object.keys(temp_rate_constants[temperature])

        if (!temp_rate_constants) return await dialog.message(`Error reading file ${processed_file}`, { type: 'error' })
        window.createToast(`Loaded file ${rate_constant_filename}`, 'success')
        rate_constant_file_loaded = true
    }

    let temp_rate_constants_for_txt: {
        temperatures: number[]
        rate_constants_values: {
            val: number[]
            std: number[]
        }
    } = {
        temperatures: [],
        rate_constants_values: {
            val: [],
            std: [],
        },
    }

    const plot_fn_temp = async () => {
        if (isEmpty(temp_rate_constants)) return await dialog.message('No data to plot', { type: 'error' })
        let temperatures = []
        for (const temp in temp_rate_constants) {
            if (!temp_rate_constants[temp][rate_coefficient_label]) continue
            temperatures = [...temperatures, temp]
        }

        const rate_constants_values = { val: [], std: [] }
        temperatures.map((t) => {
            const val_std = temp_rate_constants[t][rate_coefficient_label][rate_constant_mean_value_type]
            rate_constants_values.val = [...rate_constants_values.val, get_nominal_value(val_std)]
            rate_constants_values.std = [...rate_constants_values.std, get_std_value(val_std)]
        })
        temp_rate_constants_for_txt = { temperatures, rate_constants_values }
        // console.log({ rate_constants_values, temperatures })
        const dataToPlot = {
            x: temperatures,
            y: rate_constants_values.val,
            name: 'rate constants',
            mode: 'markers',
            line: { color: `rgb${Colors[0]}` },
            error_y: {
                type: 'data',
                array: rate_constants_values.std,
                visible: true,
                color: `rgb${Colors[0]}`,
            },
        }
        const { ylabel_units } = temp_rate_constants[temperatures[0]][rate_coefficient_label]
        const layout = {
            title: 'Rate constant vs Temperature',
            xaxis: { title: 'Temperature (K)' },
            yaxis: {
                title: ylabel_units ? `${rate_coefficient_label} [${ylabel_units}]` : rate_coefficient_label,
                tickformat: '.0e',
            },
        }

        react('kinetic_plot_f_temp_rate', [dataToPlot], layout)
    }

    const reset_values = () => {
        rate_constant_values = {
            processed: {},
            fitted: {},
        }
        number_densities = { val: [], std: [] }
        fitted_values = { val: [], std: [] }
        temp_rate_constants_for_txt = {
            temperatures: [],
            rate_constants_values: {
                val: [],
                std: [],
            },
        }
        console.warn('values reset')
    }

    const save_txt_file = async (filename: string, data: string[]) => {
        const saveloc = await path.join(processed_dir, 'txt_files')
        if (!(await fs.exists(saveloc))) await fs.createDir(saveloc)

        const first_name = processed_rateConstants_filename.processed.split('.')[0]
        const append_name = `${first_name}_${rate_coefficient_label}`

        const [err] = await oO(fs.writeTextFile(await path.join(saveloc, `${append_name}_${filename}`), data.join('')))
        if (err) return await dialog.message(`Error saving file ${filename}`, { type: 'error' })
    }

    const save_effective_ke_to_txt_file = async () => {
        const current_temp_ke = rate_constant_values.fitted[temperature][rate_coefficient_label]
        if (!current_temp_ke) return
        const { number_densities, ke, slope, intercept, fitX, fitY } = current_temp_ke

        let data_ke = [
            `# temperature = ${temperature} K\n`,
            `# number_density\tnumber_density_std\t${rate_coefficient_label}_effective_rate_constant\t${rate_coefficient_label}_effective_rate_constant_std\n`,
        ]

        for (let i = 0; i < number_densities.val.length; i++) {
            data_ke = [
                ...data_ke,
                `${number_densities.val[i]}\t${number_densities.std[i]}\t${ke.val[i]}\t${ke.std[i]}\n`,
            ]
        }
        const ke_filename = `effective_rate_constant_${temperature}K_func_of_number_density.txt`
        save_txt_file(ke_filename, data_ke)

        let data_fitted_ke = [
            `# temperature = ${temperature} K\n`,
            `# slope = ${slope} K\n`,
            `# intercept = ${intercept} K\n`,
            `# fitted_number_density\tfitted_${rate_coefficient_label}_effective_rate_constant\n`,
        ]

        for (let i = 0; i < fitX.length; i++) {
            data_fitted_ke = [...data_fitted_ke, `${fitX[i]}\t${fitY[i]}\n`]
        }
        const ke_fit_filename = `effective_rate_constant_${temperature}K_func_of_number_density_fitted.txt`
        save_txt_file(ke_fit_filename, data_fitted_ke)
    }

    const save_fn_of_T_to_txt_file = async () => {
        if (temp_rate_constants_for_txt.temperatures.length === 0) return
        const { temperatures, rate_constants_values } = temp_rate_constants_for_txt
        let data_temp_rate_constants = [
            `# temperatures\t${rate_coefficient_label}_rate_constant\t${rate_coefficient_label}_rate_constant_std\n`,
        ]

        for (let i = 0; i < temperatures.length; i++) {
            data_temp_rate_constants = [
                ...data_temp_rate_constants,
                `${temperatures[i]}\t${rate_constants_values.val[i]}\t${rate_constants_values.std[i]}\n`,
            ]
        }
        const filename_temp_rate_constants = `rate_constants_func_of_temperature.txt`
        save_txt_file(filename_temp_rate_constants, data_temp_rate_constants)
    }

    const save_fn_of_ND_to_txt_file = async () => {
        const current_temp_rate_constants = rate_constant_values.processed[temperature][rate_coefficient_label]
        let data_rate_constants = [
            `# temperature = ${temperature} K\n`,
            `# number_density\tnumber_density_std\t${rate_coefficient_label}_rate_constant\t${rate_coefficient_label}_rate__constant_std\n`,
        ]

        let data_rates = [
            `# weighted_mean = ${weighted_mean}\n`,
            `# number_density\tnumber_density_std\t${rate_coefficient_label}_rate\t${rate_coefficient_label}_rate_std\n`,
        ]

        for (let i = 0; i < fitted_values.val.length; i++) {
            data_rates = [
                ...data_rates,
                `${number_densities.val[i]}\t${number_densities.std[i]}\t${fitted_values.val[i]}\t${fitted_values.std[i]}\n`,
            ]

            data_rate_constants = [
                ...data_rate_constants,
                `${number_densities.val[i]}\t${number_densities.std[i]}\t${current_temp_rate_constants.val[i]}\t${current_temp_rate_constants.std[i]}\n`,
            ]
        }

        const filename_rates = `rates_${temperature}K_func_of_number_density.txt`
        const filename_rate_constants = `rate_constants_${temperature}K_func_of_number_density.txt`

        save_txt_file(filename_rates, data_rates)
        save_txt_file(filename_rate_constants, data_rate_constants)
    }

    const autoChangeName = persistentWritable('kinetics_processing_auto_change_name', true)
</script>

<SeparateWindow
    bind:active
    title="Kinetics Plot"
    graphMode={true}
    autoHide={true}
    maximize={true}
    mainContent$style="display: grid; overflow:auto; padding: 0 1em;"
    id="kinetics_plot_window"
>
    <svelte:fragment slot="header_content__slot">
        <FileListsModal bind:active={filelists_selection_modal_active} bind:fileCollections />

        <div class="flex w-full justify-end gap-2" class:hide={hide_header}>
            <button class="button is-link" on:click={async () => await load_data_for_processing()}>load files</button>
            <button class="button is-link" on:click={() => (filelists_selection_modal_active = true)}>
                <span>Filelists</span>
                <i class="i-mdi-open-in-new text-xs ml-2" />
                <Badge class="has-background-{selected_file_length > 0 ? 'warning' : 'danger'}"
                    >{selected_file_length || ''}</Badge
                >
            </button>

            {#each saved_filenames as filename}
                <Textfield value={$kinetics_filenames[filename]} label={`*.${filename}.json`} disabled />
            {/each}

            <Select
                bind:value={tag}
                label="tag"
                options={tagOpts}
                on:change={async () => {
                    await load_data_for_processing({ toast: false })
                    await process_data({ toast: false })
                    window.createToast(`Tag changed to ${tag}`, 'success')
                }}
            />
            <button class="button is-warning" on:click={async () => await process_data()}>process files</button>
            <div data-cooltipz-dir="left" aria-label="save *.processed.json">
                <button class="i-material-symbols-save-rounded" on:click={save_data} />
            </div>
        </div>

        <div class="flex" class:hide={hide_header}>
            <h3>Processed files</h3>
            <button
                class="i-material-symbols-folder-open-outline"
                on:click={async () => {
                    if (!(await fs.exists(processed_dir)))
                        return window.createToast(`Directory does not exist`, 'danger')
                    await shell.open(processed_dir)
                }}
            />
        </div>

        <div class="flex" class:hide={hide_header}>
            <TextAndSelectOptsToggler
                style="width: 20em;"
                bind:value={$processed_filename}
                label={`*.processed.json`}
                lookFor={'.processed.json'}
                lookIn={processed_dir}
                on:change={async () => {
                    data_loaded = false
                    reset_values()
                    file_available.processed = await check_processed_file($processed_filename)
                    if (!$autoChangeName) return
                    const firstName = $processed_filename.split('.')[0]
                    processed_rateConstants_filename.fitted = firstName + '.rateConstants.fitted.json'
                    processed_rateConstants_filename.processed = firstName + '.rateConstants.processed.json'
                }}
            />
            <Textfield
                style="width: 20em;"
                disabled
                value={processed_params_filename}
                label={`*params.processed.json`}
            />
            {#if file_available.processed}
                <button class="button is-warning" on:click={load_data}>load</button>
                <ButtonBadge id="kinetic-plot-submit-button" on:click={plot_number_density} label="plot f(ND)" />
            {:else}
                <span>{'Load => process => save file to continue plotting'}</span>
            {/if}
            <Checkbox class="ml-auto" bind:value={$autoChangeName} label="auto-change-names" />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        {#if data_loaded && temperature && rate_coefficient_label}
            <h2>Function of number density</h2>
            <div class="kinetics_graph graph__div" id={f_ND_plot_ID} />

            <hr />
            <h2>rateConstant = rate / ND<sup>{polyOrder}</sup></h2>

            <div class="align">
                <Textfield disabled value={weighted_mean || ''} label="weighted mean" />
                <button
                    class="button is-link"
                    on:click={async ({ currentTarget }) => {
                        toggle_loading(currentTarget)
                        await oO(compute_rate_constant())
                        toggle_loading(currentTarget)
                    }}
                    >compute rate constant
                </button>

                {#if rate_constant_data_loaded}
                    <button class="button is-link" on:click={plot_rate_constant}>plot rate constant </button>
                {/if}

                <div class="flex ml-auto">
                    <TextAndSelectOptsToggler
                        style="width: 20em;"
                        bind:value={processed_rateConstants_filename.processed}
                        label={`*.rateConstants.processed.json`}
                        lookFor={'.rateConstants.processed.json'}
                        lookIn={processed_dir}
                    />
                    <button class="i-material-symbols-save-rounded" on:click={() => save_rate_constants('processed')} />
                </div>
            </div>
            <div class="kinetics_graph graph__div" id="{f_ND_plot_ID}_rateconstant" />
            <hr />

            <div class="flex flex-col items-start w-full">
                <div class="align">
                    <span class="tag is-warning">Fit</span>
                    <h2>
                        rate = effective_rateConstant * ND<sup>order</sup> = rateConstant * ND <sup>x</sup>
                        {addIntercept ? ' + intercept' : ''}
                    </h2>
                </div>

                <div class="align">
                    <Checkbox bind:value={addIntercept} label="add intercept" />
                    <Textfield style="width: 7em;" bind:value={effective_rate_polyOrder} label="order" />
                    <Textfield style="width: 7em;" bind:value={polyOrderRateConstant} label="x" />
                    <Textfield style="width: 7em;" bind:value={$rate_constant_guess} label="rateConstant guess" />
                    {#if addIntercept}
                        <Textfield style="width: 7em;" bind:value={$intercept_guess} label="intercept guess" />
                    {/if}
                    <button class="button is-link ml-5" on:click={derive_rate_constant}>Fit</button>
                    <div class="flex ml-auto">
                        <TextAndSelectOptsToggler
                            style="width: 20em;"
                            bind:value={processed_rateConstants_filename.fitted}
                            label={`*.rateConstants.fitted.json`}
                            lookFor={'.rateConstants.fitted.json'}
                            lookIn={processed_dir}
                        />
                        <button
                            class="i-material-symbols-save-rounded"
                            on:click={() => save_rate_constants('fitted')}
                        />
                    </div>
                </div>

                <h3>Fitted parameters</h3>
                <div class="align">
                    <Textfield
                        bind:value={fitted_slope}
                        label="rateConstant (cm^{3 * (effective_rate_polyOrder + polyOrderRateConstant)}.s-1)"
                        disabled
                    />
                    <Textfield bind:value={fitted_intercept} label="intercept (s-1)" disabled />
                </div>
            </div>
            <div class="kinetics_graph graph__div" id="{f_ND_plot_ID}_effective_rateconstant" />
            <hr />

            <h2>Function of temperature</h2>

            {#if file_available.rateConstants}
                <div class="align">
                    <Select
                        bind:value={rate_constant_mean_value_type}
                        options={rate_constant_mean_value_type_options}
                        label="rate constant value"
                    />
                    <Select
                        bind:value={rate_constant_filename}
                        options={Object.values(processed_rateConstants_filename)}
                        label="rate constant file"
                        on:change={() => {
                            rate_constant_mean_value_type = rate_constant_mean_value_type_options[0]
                        }}
                    />
                    <button class="button is-warning" on:click={load_temp_rate_constants}>load</button>
                    {#if rate_constant_file_loaded}
                        <ButtonBadge id="kinetic-plot-submit-button" on:click={plot_fn_temp} label="plot f(T)" />
                        <button class="button is-link" on:click={save_fn_of_T_to_txt_file}>Write to .txt</button>
                    {:else}
                        <span class="tag is-warning">select rate constant value type and filename to plot f(T)</span>
                    {/if}
                </div>
                <div class="kinetics_graph graph__div" id="kinetic_plot_f_temp_rate" />
            {:else}
                <span>Save rate constants file(s) to continue</span>
            {/if}
        {/if}
    </svelte:fragment>

    <svelte:fragment slot="left_footer_content__slot">
        {#if data_loaded}
            <i class="i-material-symbols-check-circle-outline" />
            <div class="tag is-warning">data loaded</div>
        {:else}
            <i class="i-carbon-close-outline" />
            <div class="tag is-danger">no data</div>
        {/if}
        <div aria-label="toggle header visibility" data-cooltipz-dir="top">
            {#if hide_header}
                <button
                    on:click={() => (hide_header = !hide_header)}
                    class="i-material-symbols-visibility-off-rounded"
                />
            {:else}
                <button on:click={() => (hide_header = !hide_header)} class="i-material-symbols-visibility-rounded" />
            {/if}
        </div>
        {#if data_loaded}
            <div class="flex items-end">
                <Select
                    class={temperature ? '' : 'has-background-danger'}
                    on:change={() => {
                        if (!(temperature && rate_coefficient_label)) return
                        plot_number_density()
                    }}
                    bind:value={temperature}
                    options={temperature_values}
                    label="temperature"
                />
                <Select
                    class={rate_coefficient_label ? '' : 'has-background-danger'}
                    on:change={() => {
                        if (!(temperature && rate_coefficient_label)) return
                        polyOrder = ''
                        plot_number_density()
                    }}
                    bind:value={rate_coefficient_label}
                    options={parameters.labels}
                    label="rate constant"
                />
                <div class:has-background-danger={!polyOrder}>
                    <Textfield
                        style="width: 5em;"
                        bind:value={polyOrder}
                        label="polyOrder"
                        on:keyup={async (e) => {
                            if (!(graph_plotted.number_densities && polyOrder)) return
                            if (e.key === 'Enter') {
                                await compute_rate_constant()
                                plot_rate_constant()
                            }
                        }}
                    />
                </div>
            </div>
        {/if}
    </svelte:fragment>
</SeparateWindow>

<style>
    .kinetics_graph {
        justify-self: center;
        margin-top: 0.5em;
    }
</style>
