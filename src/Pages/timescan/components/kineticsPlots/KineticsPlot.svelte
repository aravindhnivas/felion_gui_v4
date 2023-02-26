<script lang="ts">
    import { kinetics_filenames } from '$src/Pages/timescan/stores'
    import ButtonBadge from '$src/components/ButtonBadge.svelte'
    import { Textfield, SeparateWindow, Select } from '$src/components'
    import TextAndSelectOptsToggler from '$src/components/TextAndSelectOptsToggler.svelte'
    import { isEmpty } from 'lodash-es'

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

    const plot_number_density = (number_densities, fitted_values) => {
        graph_plotted.number_densities = false
        const data_rate: Plotly.Data[] = [
            {
                x: number_densities.val,
                y: fitted_values.val,
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
            // width: graphWidth,
        }

        react('kinetic_plot_f_ND_rate', data_rate, layout_rate)
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

        const current_data = full_data[temperature]
        const ND_keys = Object.keys(current_data)

        let number_densities = { val: [], std: [] }
        let fitted_values = { val: [], std: [] }

        ND_keys.forEach((nd) => {
            if (!current_data[nd][rate_coefficient]) return
            const ND_val = get_nominal_value(nd)
            const ND_std = get_std_value(nd)
            number_densities.val = [...number_densities.val, ND_val]
            number_densities.std = [...number_densities.std, ND_std]

            fitted_values.val = [...fitted_values.val, current_data[nd][rate_coefficient].val]
            fitted_values.std = [...fitted_values.std, current_data[nd][rate_coefficient].std]
        })
        const sorted = number_densities.val.map((val, index) => [val, index]).sort((a, b) => a[0] - b[0])
        const sorted_indices = sorted.map((val) => val[1])

        number_densities.val = sorted_indices.map((index) => number_densities.val[index])
        number_densities.std = sorted_indices.map((index) => number_densities.std[index])
        fitted_values.val = sorted_indices.map((index) => fitted_values.val[index])
        fitted_values.std = sorted_indices.map((index) => fitted_values.std[index])
        // console.log({ number_densities, fitted_values })
        if (!fitted_values.val.length) return

        plot_number_density(number_densities, fitted_values)
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

    const fixWidth = () => {
        if (graph_plotted.number_densities) relayout('kinetic_plot_f_ND_rate', { width: graphWidth })
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
                    on:change={() => {
                        plot()
                    }}
                    bind:value={temperature}
                    options={Object.keys(full_data)}
                    label="temperature"
                />
                <Select
                    on:change={() => {
                        plot()
                    }}
                    bind:value={rate_coefficient}
                    options={parameters}
                    label="rate coefficient"
                />
            </div>

            <div class="align mt-5 items-baseline" bind:clientWidth={graphWidth}>
                <div class="graph">
                    <h2>Function of number density</h2>
                    <div class="graph__div" id="kinetic_plot_f_ND_rate" />
                </div>
                <hr />

                <div class="graph">
                    <h2>Function of temperature</h2>
                    <div class="graph__div" id="kinetic_plot_f_temp_rate" />
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
        <button class="button is-warning" on:click={fixWidth}>FIX-width</button>
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
