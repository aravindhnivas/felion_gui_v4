<script lang="ts">
    import { kinetics_filenames } from '$src/Pages/timescan/stores'
    import ButtonBadge from '$src/components/ButtonBadge.svelte'
    import { Textfield, SeparateWindow, Select, Checkbox } from '$src/components'
    import TextAndSelectOptsToggler from '$src/components/TextAndSelectOptsToggler.svelte'
    import { isEmpty } from 'lodash-es'
    import computePy_func from '$lib/pyserver/computePy'
    import Colors from '$lib/misc/colors'
    export let active = false
    export let configDir: string = ''

    let graph_plotted = { number_densities: false, temperature: false }
    let full_data = {}

    let data_loaded = false
    let parameters = []
    let processed_dir = ''
    let processed_filename = 'kinetics.processed.json'
    let processed_params_filename = 'kinetics.params.processed.json'

    const update_dir = async (dir: string) => {
        processed_dir = await path.join(dir, 'processed')
    }
    $: update_dir(configDir)

    let number_densities = { val: [], std: [] }
    let fitted_values = { val: [], std: [] }

    const f_ND_plot_ID = 'kinetic_plot_f_ND_rate'

    const plot_number_density = () => {
        graph_plotted.number_densities = false
        const data_rate: Partial<Plotly.PlotData>[] = [
            {
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
            },
        ]

        const layout_rate: Partial<Plotly.Layout> = {
            title: `${rate_coefficient} as a function of number density`,
            xaxis: { title: 'number density [cm <sup>-3</sup>]', tickformat: '.0e' },
            yaxis: { title: `${rate_coefficient} [s <sup>-1</sup>]` },
        }

        react(f_ND_plot_ID, data_rate, layout_rate)

        const data_rate_constant = structuredClone(data_rate).map((d) => {
            d.y = d.x.map((x, i) => d.y[i] / x ** polyOrder)
            d.error_y = null
            return d
        })

        console.log(data_rate_constant)
        const layout_rate_constant = {
            ...layout_rate,
            title: `${rate_coefficient} as a function of number density (constant)`,
            yaxis: { title: `${rate_coefficient} [s <sup>-1</sup> cm <sup>${3 * polyOrder}</sup>]`, tickformat: '.0e' },
        }

        react(`${f_ND_plot_ID}_rateconstant`, data_rate_constant, layout_rate_constant)
        graph_plotted.number_densities = true
    }

    const load_data = async () => {
        const processed_file = await path.join(processed_dir, processed_filename)
        if (!(await fs.exists(processed_file))) {
            await dialog.message(`${processed_file} does not exist`, { type: 'error' })
            return
        }

        const [_err1, data] = await oO(fs.readTextFile(processed_file))
        if (_err1) return await dialog.message(`Error reading file ${processed_file}`, { type: 'error' })
        full_data = JSON.parse(data)

        window.createToast(`${processed_filename} loaded`, 'success')

        const processed_params_file = await path.join(processed_dir, processed_params_filename)
        const [_err2, params] = await oO(fs.readTextFile(processed_params_file))
        if (_err2)
            return await dialog.message(`Error reading file ${processed_params_filename}`, {
                type: 'error',
            })
        parameters = JSON.parse(params)
        window.createToast(`${processed_params_filename} loaded`, 'success')

        data_loaded = true
        plot()
    }

    const process_data = async (e: Event) => {
        if (!(await fs.exists(configDir))) return await dialog.message('No config directory found')

        const fit_data = await parse_file($kinetics_filenames.fit)
        const config_data = await parse_file($kinetics_filenames.configs)
        let rate_paramters = { forwards: [], backwards: [] }

        for (const filename in fit_data) {
            if (!config_data[filename]) continue

            Object.keys(fit_data[filename]['default']['k3_fit']).forEach((key) => {
                if (!rate_paramters.forwards.includes(key)) rate_paramters.forwards = [...rate_paramters.forwards, key]
            })

            Object.keys(fit_data[filename]['default']['kCID_fit']).forEach((key) => {
                if (!rate_paramters.backwards.includes(key))
                    rate_paramters.backwards = [...rate_paramters.backwards, key]
            })

            const { temp, ND } = config_data[filename]

            if (!full_data[temp]) full_data[temp] = {}

            rate_paramters.forwards.forEach((key) => {
                if (!full_data[temp][ND]) full_data[temp][ND] = {}

                const fit_val = fit_data[filename]['default']['k3_fit'][key]
                if (!fit_val) return
                const [fitted_val, fitted_val_std] = fit_val
                if (!full_data[temp][ND][key]) full_data[temp][ND][key] = { val: null, std: null }
                full_data[temp][ND][key].val = fitted_val
                full_data[temp][ND][key].std = fitted_val_std
            })

            rate_paramters.backwards.forEach((key) => {
                if (!full_data[temp][ND]) full_data[temp][ND] = {}
                const fit_val = fit_data[filename]['default']['kCID_fit'][key]
                if (!fit_val) return
                const [fitted_val, fitted_val_std] = fit_val
                if (!full_data[temp][ND][key]) full_data[temp][ND][key] = { val: null, std: null }
                full_data[temp][ND][key].val = fitted_val
                full_data[temp][ND][key].std = fitted_val_std
            })
        }
        parameters = [...rate_paramters.forwards, ...rate_paramters.backwards]
        // console.log({ full_data })
        window.createToast('Data processed and loaded', 'success')
        // graph_plotted.number_densities = false
        // graph_plotted.temperature = false
        data_loaded = true
        plot()
    }

    const plot = () => {
        if (!data_loaded) return
        added_traces = 0
        const current_data = full_data[temperature]
        const ND_keys = Object.keys(current_data)
        const Number_densities = { val: [], std: [] }
        const Fitted_values = { val: [], std: [] }

        ND_keys.forEach((nd) => {
            if (!current_data[nd][rate_coefficient]) return
            const ND_val = get_nominal_value(nd)
            const ND_std = get_std_value(nd)
            Number_densities.val = [...Number_densities.val, ND_val]
            Number_densities.std = [...Number_densities.std, ND_std]

            Fitted_values.val = [...Fitted_values.val, current_data[nd][rate_coefficient].val]
            Fitted_values.std = [...Fitted_values.std, current_data[nd][rate_coefficient].std]
        })
        const sorted = Number_densities.val.map((val, index) => [val, index]).sort((a, b) => a[0] - b[0])
        const sorted_indices = sorted.map((val) => val[1])

        Number_densities.val = sorted_indices.map((index) => Number_densities.val[index])
        Number_densities.std = sorted_indices.map((index) => Number_densities.std[index])
        Fitted_values.val = sorted_indices.map((index) => Fitted_values.val[index])
        Fitted_values.std = sorted_indices.map((index) => Fitted_values.std[index])

        // console.log({ Number_densities, Fitted_values })
        if (!Fitted_values.val.length) return

        number_densities = structuredClone(Number_densities)
        fitted_values = structuredClone(Fitted_values)
        plot_number_density()

        // fixWidth()
    }

    const get_nominal_value = (value: string) => {
        const [value_std, power] = value.split('e')
        return value_std.split('+/-')[0].replace('(', '') + 'e' + power
    }

    const get_std_value = (value: string) => {
        const [value_std, power] = value.split('e')
        return value_std.split('+/-')[1].replace(')', '') + 'e' + power
    }

    const parse_file = async (filename: string) => {
        const fullpath = await path.join(configDir, filename)
        if (!(await fs.exists(fullpath))) return await dialog.message(`File ${filename} does not exist in ${configDir}`)
        const filename_data = await fs.readTextFile(fullpath)
        const filename_json = JSON.parse(filename_data)
        return filename_json
    }

    let temperature = '4.7'
    let rate_coefficient = 'k31'
    let graphWidth: number

    $: saved_filenames = Object.keys($kinetics_filenames).filter((key) => key !== 'channels')

    let graphDivs: HTMLDivElement[] = []
    onMount(async () => {
        graphDivs = Array.from(document.querySelectorAll<HTMLDivElement>('.kinetics_graph'))
        // console.log({ graphDivs })
    })
    const fixWidth = () => {
        if (graph_plotted.number_densities) {
            console.log('fixing width', graphDivs)
            graphDivs.forEach((div) => {
                // console.log({ div })
                if (!div.data) return
                relayout(div.id, { width: graphWidth })
            })
        }
    }

    const save_data = async () => {
        if (isEmpty(full_data)) return await dialog.message('No data to save', { type: 'error' })
        if (!(await fs.exists(processed_dir))) await fs.createDir(processed_dir)

        const processed_file = await path.join(processed_dir, processed_filename)
        const [err1] = await oO(fs.writeTextFile(processed_file, JSON.stringify(full_data, null, 4)))
        if (err1) return await dialog.message(`Error saving file ${processed_file}`)

        window.createToast(`Saved file ${processed_filename}`, 'success')

        const processed_params_file = await path.join(processed_dir, processed_params_filename)
        const [err2] = await oO(fs.writeTextFile(processed_params_file, JSON.stringify(parameters)))
        if (err2) return await dialog.message(`Error saving file ${processed_params_filename}`)

        window.createToast(`Saved file ${processed_params_filename}`, 'success')
    }

    let hide_header = false
    let addIntercept = true
    let polyOrder = 2

    let added_traces = 0
    let fitted_intercept = ''
    let fitted_slope = ''

    const intercept_guess = persistentWritable('kinetics_intercept_guess', 0)
    const rate_constant_guess = persistentWritable('kinetics_rate_constant_guess', 1e-30)

    async function derive_rate_constant(e: Event) {
        if (!graph_plotted.number_densities) return await dialog.message('No data to fit', { type: 'error' })
        if (!fitted_values.val.length) return await dialog.message('No data to fit', { type: 'error' })
        if (added_traces > 0) {
            deleteTraces(f_ND_plot_ID, -1)
            added_traces--
        }

        const pyfile = 'kineticsCode.derive_rate_constants'

        const args = {
            polyOrder,
            addIntercept,
            fitted_values,
            number_densities,
            $intercept_guess,
            $rate_constant_guess,
        }

        const dataFromPython: void | {
            fitted_intercept: string
            fitted_slope: string
            fitY: { val: number[]; std: number[]; name: string }
        } = await computePy_func({ e, pyfile, args })

        if (!dataFromPython) return

        const { fitY } = dataFromPython

        ;({ fitted_intercept, fitted_slope } = dataFromPython)
        addTraces(f_ND_plot_ID, [
            {
                x: number_densities.val,
                y: fitY.val,
                // name: fitY.name,
                name: 'fit',
                mode: 'lines',
                line: { color: `rgb${Colors[0]}` },
                error_y: {
                    type: 'data',
                    array: fitY.std,
                    visible: true,
                    color: `rgb${Colors[0]}`,
                },
            },
        ])
        added_traces++
        // console.log({ dataFromPython })
    }
</script>

<SeparateWindow
    bind:active
    title="Kinetics Plot"
    graphMode={true}
    autoHide={true}
    maximize={true}
    mainContent$style="display: grid; overflow:hidden;"
>
    <svelte:fragment slot="header_content__slot">
        <div class="flex" class:hide={hide_header}>
            <Textfield style="width: 100%;" value={configDir} label="config directory" disabled />
            <button
                class="i-material-symbols-folder-open-outline text-xl"
                on:click={async () => {
                    await oO(shell.open(configDir))
                }}
            />
        </div>

        <div class="flex" class:hide={hide_header}>
            <TextAndSelectOptsToggler
                bind:value={processed_filename}
                label={`*.processed.json`}
                lookFor={'.processed.json'}
                lookIn={processed_dir}
            />
            <TextAndSelectOptsToggler
                bind:value={processed_params_filename}
                label={`*.params.processed.json`}
                lookFor={'.params.processed.json'}
                lookIn={processed_dir}
            />
            <button class="button is-warning" on:click={load_data}>load</button>
        </div>

        <div class="flex" class:hide={hide_header}>
            <div class="flex w-full justify-end gap-1">
                {#each saved_filenames as filename}
                    <Textfield value={$kinetics_filenames[filename]} label={`*.${filename}.json`} disabled />
                {/each}
                <button class="button is-warning" on:click={process_data}>process data</button>
                <button class="i-material-symbols-save-rounded text-2xl" on:click={save_data} />
            </div>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <div class="main_container px-10">
            <div class="align">
                <Select
                    on:change={plot}
                    bind:value={temperature}
                    options={Object.keys(full_data)}
                    label="temperature"
                />
                <Select on:change={plot} bind:value={rate_coefficient} options={parameters} label="rate coefficient" />
                <Textfield bind:value={polyOrder} label="rate constant polyorder" />
            </div>

            <div class="align mt-5 items-baseline" bind:clientWidth={graphWidth}>
                <div class="graph">
                    <h2>Function of number density</h2>
                    <div class="kinetics_graph graph__div" id={f_ND_plot_ID} />
                    <div class="kinetics_graph graph__div" id="{f_ND_plot_ID}_rateconstant" />
                </div>

                <hr />

                <div class="flex flex-col items-start">
                    <h2>
                        Fit rate vs f(ND): rate = slope * ND <sup>{polyOrder}</sup>
                        {addIntercept ? ' + intercept' : ''}
                    </h2>
                    <div class="align">
                        <Checkbox bind:value={addIntercept} label="add intercept" />
                        <!-- <Textfield style="width: 7em;" bind:value={polyOrder} label="poly-order" /> -->
                        <Textfield style="width: 7em;" bind:value={$rate_constant_guess} label="slope guess" />
                        {#if addIntercept}
                            <Textfield style="width: 7em;" bind:value={$intercept_guess} label="intercept guess" />
                        {/if}
                        <button class="button is-link ml-5" on:click={derive_rate_constant}>Fit</button>
                    </div>

                    <h3>Fitted parameters</h3>
                    <div class="align">
                        <Textfield bind:value={fitted_slope} label="slope (cm^{3 * polyOrder}.s-1)" disabled />
                        <Textfield bind:value={fitted_intercept} label="intercept (s-1)" disabled />
                    </div>
                </div>

                <hr />
                <div class="graph">
                    <h2>Function of temperature</h2>
                    <div class="kinetics_graph graph__div" id="kinetic_plot_f_temp_rate" />
                </div>
            </div>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="left_footer_content__slot">
        {#if data_loaded}
            <i class="i-material-symbols-check-circle-outline" />
            <div class="tag is-warning">data loaded</div>
        {:else}
            <i class="i-carbon-close-outline" />
            <div class="tag is-danger">no data</div>
        {/if}
        <div aria-label="hide header" data-cooltipz-dir="top">
            {#if hide_header}
                <button
                    on:click={() => (hide_header = !hide_header)}
                    class="i-material-symbols-visibility-off-rounded text-2xl"
                />
            {:else}
                <button
                    on:click={() => (hide_header = !hide_header)}
                    class="i-material-symbols-visibility-rounded text-2xl"
                />
            {/if}
        </div>
    </svelte:fragment>

    <svelte:fragment slot="footer_content__slot">
        <button class="button is-warning" on:click={fixWidth}>full-width</button>
        <ButtonBadge id="kinetic-plot-submit-button" on:click={plot} label="PLOT" />
    </svelte:fragment>
</SeparateWindow>

<style>
    .main_container {
        display: grid;
        grid-template-rows: auto 1fr;
        grid-gap: 0.5rem;
        align-items: baseline;
        overflow-y: auto;
    }
    .graph {
        display: grid;
        width: 100%;
        grid-template-rows: auto 1fr;
        gap: 0.5em;
    }
</style>
