<script lang="ts">
    import { trapTemp, currentLocation, output_dir } from '../stores/common'
    import { TextSwitch, Notify, SeparateWindow, ButtonBadge } from '$src/components'
    import { plot } from '../../../js/functions'
    import boltzman_distribution from '../functions/boltzman_distribution'
    import { sumBy } from 'lodash-es'
    import computePy_func from '$lib/pyserver/computePy'
    import type WinBox from 'winbox'
    import { save_data_to_file } from '../functions/utils'

    export let active = false
    export let graphWindow: WinBox | null = null

    const title = 'Boltzmann Distribution'
    const plotID = 'boltzmanDistributionPlot'

    let windowReady = false

    let plotData: (string[] | number[])[] = [[], []]

    function plotGraph() {
        const computedData = boltzman_distribution($trapTemp)
        if (computedData === null) return

        const { distribution, partitionValue } = computedData
        console.log('Computing', distribution)

        const totalSum = sumBy(distribution, (e) => e.value)
        const energyLevel = distribution.map((e) => e.label)
        const populations = distribution.map((e) => e.value)
        plotData = [energyLevel, populations]

        const data: PlotData = {
            x: energyLevel,
            y: populations,
            mode: 'lines+markers',
            showlegend: true,
            name: `Temp: ${$trapTemp}K, Z: ${partitionValue.toFixed(2)}, Total: ${totalSum.toFixed(2)}`,
        }
        const dataToPlot = { data }
        plot(`${title}: ${$trapTemp}K`, 'Energy Levels', 'Population', dataToPlot, plotID)
        console.log('Plotted')
    }

    $: if (windowReady) {
        setTimeout(() => graphWindow?.focus(), 100)
    }

    $: if (windowReady && $trapTemp > 0) {
        plotGraph()
    }

    let saveInfo = { msg: '', error: '' }
    const update_output_file = async (_loc: string, _trapTemp: number) => {
        outputFile = await path.join(_loc, `boltzman/boltzman_distribution${_trapTemp}K.dat`)
    }
    $: update_output_file($output_dir, $trapTemp)
    let outputFile = ''

    const saveData = async () => {
        const length = plotData[0].length
        let writeContent = '# Energy Levels\t Population \n'
        for (let i = 0; i < length; i++) {
            writeContent += `${plotData[0][i]}\t${plotData[1][i]}\n`
        }
        saveInfo = await save_data_to_file(outputFile, writeContent)
    }

    const openFigure = async (e?: Event) => {
        if (!(await fs.exists(outputFile))) {
            window.createToast('No data to open', 'danger')
            return
        }

        const figsDir = await path.join($currentLocation, '../output/figs')
        if (!(await fs.exists(figsDir))) {
            await fs.createDir(figsDir)
        }

        const args = {
            figArgs: {
                figXlabel: 'J',
                figYlabel: 'Relative population',
                location: figsDir,
                x_type: 'string',
                y_type: 'float',
            },
            files: [outputFile],
        }
        computePy_func({ e, pyfile: 'utils.plotXY', args, general: true })
    }
</script>

<SeparateWindow {title} bind:active bind:windowReady bind:graphWindow maximize={false}>
    <svelte:fragment slot="header_content__slot">
        <div class="align">
            <TextSwitch bind:value={$trapTemp} label="Temperature (K)" />
            <button class="button is-link" on:click={plotGraph}>Compute</button>
            <button class="button is-link" on:click={saveData}>Save data</button>
            <ButtonBadge label="Produce figure" on:click={openFigure} />
        </div>

        <Notify label={saveInfo.error || saveInfo.msg} type={saveInfo.error ? 'danger' : 'success'} />
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <div id={plotID} class="graph__div" />
    </svelte:fragment>
</SeparateWindow>
