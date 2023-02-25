<script lang="ts">
    import { kinetics_filenames } from '$src/Pages/timescan/stores'
    import { Textfield, SegBtn, Radio, SeparateWindow } from '$src/components'
    import ButtonBadge from '$src/components/ButtonBadge.svelte'

    export let active = false
    export let configDir: string = ''

    let graph_plotted = {
        number_densities: false,
        temperature: false,
    }

    const plot_number_density = (number_densities, fitted_values) => {
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
        }

        react('kinetic_plot_f_ND_rate', data_rate, layout_rate)
        graph_plotted.number_densities = true
    }

    const plot_temperature = (temperature_values) => {
        const data_rate: Plotly.Data[] = [
            {
                x: temperature_values.val,
                y: temperature_values.rate_coefficient.val,
                error_y: {
                    type: 'data',
                    array: temperature_values.rate_coefficient.std,
                    visible: true,
                },
                type: 'scatter',
                mode: 'markers',
                name: `${rate_coefficient}`,
                showlegend: true,
            },
        ]

        const layout_rate: Partial<Plotly.Layout> = {
            title: `${rate_coefficient} as a function of temperature`,
            xaxis: { title: 'temperature [K]' },
            yaxis: { title: `${rate_coefficient} [s <sup>-1</sup>]` },
        }

        react('kinetic_plot_f_temp_rate', data_rate, layout_rate)
        graph_plotted.temperature = true
    }

    const plot = async (e: Event) => {
        if (!(await fs.exists(configDir))) return await dialog.message('No config directory found')
        const fit_data = await parse_file($kinetics_filenames.fit)
        const config_data = await parse_file($kinetics_filenames.configs)

        console.log({ fit_data, config_data })

        let number_densities = { val: [], std: [] }
        let fitted_values = { val: [], std: [] }
        let temperature_values = {
            val: [],
            rate_coefficient: { val: [], std: [] },
        }

        for (const filename in fit_data) {
            if (!config_data[filename]) continue

            const { temp, ND } = config_data[filename]

            const rate = rate_type === 'forwards' ? 'k3_fit' : 'kCID_fit'
            const fit_val = fit_data[filename]['default'][rate][rate_coefficient]

            if (!fit_val) continue
            const [fitted_val, fitted_val_std] = fit_val

            // add temperature to list if it doesn't exist
            // if (!temperature_values.val.includes(temp)) {
            //     temperature_values.val = [...temperature_values.val, parseFloat(temp)]
            //     temperature_values.rate_coefficient.val = [...temperature_values.rate_coefficient.val, fitted_val]
            //     temperature_values.rate_coefficient.std = [...temperature_values.rate_coefficient.std, fitted_val_std]
            // }

            if (temperature != temp) continue

            if (!(ND && fitted_val)) continue
            fitted_values.val = [...fitted_values.val, fitted_val]
            fitted_values.std = [...fitted_values.std, fitted_val_std]
            const ND_val = get_nominal_value(ND)
            const ND_std = get_std_value(ND)
            number_densities.val = [...number_densities.val, ND_val]
            number_densities.std = [...number_densities.std, ND_std]
        }
        console.log({ fitted_values, number_densities })

        // sort by number density
        const sorted = number_densities.val.map((val, index) => [val, index]).sort((a, b) => a[0] - b[0])
        const sorted_indices = sorted.map((val) => val[1])

        number_densities.val = sorted_indices.map((index) => number_densities.val[index])
        number_densities.std = sorted_indices.map((index) => number_densities.std[index])
        fitted_values.val = sorted_indices.map((index) => fitted_values.val[index])
        fitted_values.std = sorted_indices.map((index) => fitted_values.std[index])

        // if (plot_choices.find((choice) => choice.name === 'temperature').selected) plot_temperature(temperature_values)
        if (plot_choices.find((choice) => choice.name === 'number_density').selected)
            plot_number_density(number_densities, fitted_values)
        fixWidth()
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
    let rate_type = 'forwards'

    $: saved_filenames = Object.keys($kinetics_filenames).filter((key) => key !== 'channels')

    let graphWidth: number

    let plot_choices = [
        { name: 'temperature', selected: false },
        { name: 'number_density', selected: true },
    ]

    const fixWidth = () => {
        if (graph_plotted.number_densities) relayout('kinetic_plot_f_ND_rate', { width: graphWidth })
        // if (graph_plotted.temperature) relayout('kinetic_plot_f_temp_rate', { width: graphWidth })
    }
</script>

<SeparateWindow
    bind:active
    title="Kinetics Plot"
    graphMode={true}
    autoHide={true}
    maximize={false}
    mainContent$style="display: grid; overflow:hidden;"
>
    <svelte:fragment slot="header_content__slot">
        <div class="flex w-full justify-end gap-1">
            {#each saved_filenames as filename}
                <Textfield value={$kinetics_filenames[filename]} label={`*.${filename}.json`} disabled />
            {/each}
        </div>
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <div class="align p-5 overflow-auto">
            <div class="align">
                <div class="align gap-1">
                    <Textfield bind:value={temperature} label="temperature" />
                    <Textfield bind:value={rate_coefficient} label="rate coefficient" />
                    <Radio bind:value={rate_type} options={['forwards', 'backwards']} />
                </div>
                <div class="align">
                    <div class="tag is-warning">plot {rate_coefficient} as a function of</div>
                    <SegBtn bind:choices={plot_choices} />
                </div>
            </div>

            <div class="align mt-5" bind:clientWidth={graphWidth}>
                <div class="graph__div w-full" id="kinetic_plot_f_ND_rate" />
                <!-- <div class="graph__div w-full" id="kinetic_plot_f_temp_rate" /> -->
                <div class="graph__div w-full" id="kinetic_plot_f_ND_rate_constant" />
                <!-- <div class="graph__div w-full" id="kinetic_plot_f_temp_rate_constant" /> -->
            </div>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="footer_content__slot">
        <button class="button is-warning" on:click={fixWidth}>FIX-width</button>
        <ButtonBadge id="kinetic-plot-submit-button" on:click={plot} label="PLOT" />
    </svelte:fragment>
</SeparateWindow>
