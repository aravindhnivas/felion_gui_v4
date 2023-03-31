<script lang="ts">
    import {
        opoMode,
        felixPeakTable,
        expfittedLines,
        felixOutputName,
        fittedTraceCount,
        felixopoLocation,
        felixPlotAnnotations,
    } from '../../functions/svelteWritables'
    import FelixPlotting from '../../modals/FelixPlotting.svelte'
    import { subplot, plot } from '$src/js/functions'

    import plotIndividualDataIntoGraph from '../../functions/plotIndividualDataIntoGraph'
    import { felix_opo_func } from '../../functions/felix_opo_func'
    import { TextSwitch, ButtonBadge } from '$src/components'
    import computePy_func from '$lib/pyserver/computePy'
    import { plotlayout } from '../../functions/plot_labels'
    import { felixPlotCheckboxes, felixPlotWidgets, felix_peak_detection } from '../../functions/svelteWritables'
    import { find_peaks } from '$lib/misc/utils'

    ///////////////////////////////////////////////////////////////////////////

    export let plotfile = 'average'
    export let felixfiles = []
    export let removeExtraFile: VoidFunction
    export let showall = true
    export let theoryRow = false
    export let normMethod: string
    export let theoryLocation: string

    let className = ''
    export { className as class }
    ///////////////////////////////////////////////////////////////////////////

    const uniqueID = getContext<string>('uniqueID')
    let active = false
    let deltaFELIX = 1

    const fullData = {}
    let dataReady = false

    async function plotData({ e = null, filetype = 'felix', target = null } = {}) {
        let pyfile = ''
        let args

        switch (filetype) {
            case 'felix':
                if (felixfiles.length < 1) return window.createToast('No files selected', 'danger')
                if (deltaFELIX == 0)
                    return window.createToast('Delta FELIX cannot be 0. Set it to atleast 0.5', 'danger')
                removeExtraFile()

                const graphDiv_avgplot = <Plotly.PlotlyHTMLElement>document.getElementById(`${uniqueID}-avgplot`)

                if (!graphDiv_avgplot) return window.createToast('No graphDiv found', 'danger')

                if (graphDiv_avgplot.data) {
                    relayout(`${uniqueID}-avgplot`, {
                        annotations: [],
                        shapes: [],
                    })
                }
                dataReady = false

                pyfile = 'normline.felix'
                args = { felixfiles, $deltaFELIX: deltaFELIX }

                $felixPeakTable[uniqueID] = []
                $felixPlotAnnotations[uniqueID] = []
                $felixOutputName[uniqueID] = 'averaged'

                const dataFromPython = await computePy_func({
                    e,
                    target,
                    pyfile,
                    args,
                })
                if (!dataFromPython) return

                $expfittedLines[uniqueID] = []
                $fittedTraceCount[uniqueID] = 0
                $felixPlotAnnotations[uniqueID] = []

                fullData.data = dataFromPython
                dataReady = true
                break

            case 'baseline':
                const filebrowserID = `#${uniqueID}-${$opoMode[uniqueID] ? 'o' : ''}felix_filebrowser`
                const baseline_markedfile = document.querySelector(`${filebrowserID} .marked-file`)?.textContent
                console.log(baseline_markedfile)
                if (!baseline_markedfile) {
                    return window.createToast(
                        `No ${
                            $opoMode[uniqueID] ? 'OPO' : 'FELIX'
                        } files: ctrl + left-click to select file for baseline correction`,
                        'danger'
                    )
                }
                pyfile = 'normline.baseline'
                args = {
                    filename: await path.join($felixopoLocation[uniqueID], baseline_markedfile),
                }
                computePy_func({ e, pyfile, args, general: true })
                break

            case 'matplotlib':
                const numberWidgets: { [name: string]: number } = {}
                $felixPlotWidgets.number.forEach((n) => (numberWidgets[n.label] = parseFloat(n.value)))

                const textWidgets = {}
                $felixPlotWidgets.text.forEach((n) => (textWidgets[n.label] = n.value))
                const booleanWidgets = {}
                $felixPlotWidgets.boolean.forEach((n) => (booleanWidgets[n.label] = n.value))
                const selectedWidgets = {}
                $felixPlotCheckboxes.forEach((n) => (selectedWidgets[n.label] = n.value))

                pyfile = 'normline.felix_tkplot'
                args = {
                    numberWidgets,
                    textWidgets,
                    booleanWidgets,
                    selectedWidgets,
                    location: $felixopoLocation[uniqueID],
                    normMethod,
                    theoryLocation,
                }
                computePy_func({ e, pyfile, args, general: true })
            default:
                break
        }
    }

    const find_felix_peaks = ({ x, y }) => {
        const { indices, peaks, shapes } = find_peaks({
            data: { x, y },
            plotID: `${uniqueID}-avgplot`,
            windowWidth: 4,
            threshold: 1,
        })
    }

    $: updateplot = !$opoMode[uniqueID] && dataReady && plotfile && normMethod && fullData.data
    $: if (updateplot && showall) {
        const { yaxis, xaxis, title, key } = plotlayout[normMethod]
        if (currentGraph.hasAttribute('data-plotted')) {
            plot('Baseline Corrected', 'Wavelength (cm-1)', 'Counts', fullData.data['base'], `${uniqueID}-bplot`)
            subplot(
                'Spectrum and Power Analyser',
                'Wavelength set (cm-1)',
                'SA (cm-1)',
                fullData.data['SA'],
                `${uniqueID}-saPlot`,
                'Wavelength (cm-1)',
                `Total Power (mJ)`,
                fullData.data['pow']
            )
            plot(title, xaxis.title, yaxis.title, fullData.data[key], `${uniqueID}-avgplot`)
        } else {
            felix_opo_func({ dataFromPython: fullData.data, uniqueID, mode: 'felix', normMethod })
        }
        const { x, y } = fullData.data[key][$felix_peak_detection[uniqueID].filename]
        find_felix_peaks({ x, y })
    } else if (updateplot) {
        plotIndividualDataIntoGraph({
            fullData,
            plotfile,
            uniqueID,
            normMethod,
        })
    }

    let currentGraph: HTMLElement

    onMount(() => {
        currentGraph = document.getElementById(`${uniqueID}-avgplot`)
        fittedTraceCount.init(uniqueID)
        expfittedLines.init(uniqueID)
        felix_peak_detection.init(uniqueID)

        return () => {
            expfittedLines.remove(uniqueID)
            fittedTraceCount.remove(uniqueID)
            felix_peak_detection.remove(uniqueID)
        }
    })
</script>

<FelixPlotting
    bind:active
    {theoryLocation}
    on:submit={(e) => plotData({ e: e.detail.event, filetype: 'matplotlib' })}
/>

<div class="align {className}">
    <ButtonBadge
        id="create_baseline_btn"
        on:click={(e) => plotData({ e: e, filetype: 'baseline' })}
        label="Create Baseline"
    />
    <button class="button is-link" id="felix_plotting_btn" on:click={(e) => plotData({ e: e, filetype: 'felix' })}>
        FELIX Plot
    </button>
    <TextSwitch style="width:7em" bind:value={deltaFELIX} label="Delta" step="0.5" />
    <button class="button is-link gap-2" on:click={() => (active = true)}>
        <span>Produce Figure</span>
        <i class="i-logos-matplotlib-icon text-xs" />
    </button>

    <button class="button is-link" on:click={() => (theoryRow = !theoryRow)}>Add Theory</button>
    <button
        class="button is-link"
        on:click={() => {
            $opoMode[uniqueID] = !$opoMode[uniqueID]
        }}>OPO</button
    >
</div>
