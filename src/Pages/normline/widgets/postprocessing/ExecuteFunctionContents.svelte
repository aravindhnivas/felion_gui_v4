<script lang="ts">
    import {
        opoMode,
        dataTable,
        normMethod,
        fileChecked,
        felixIndex,
        expfittedLines,
        felixPeakTable,
        felixOutputName,
        fittedTraceCount,
        felixopoLocation,
        felixPlotAnnotations,
    } from '../../functions/svelteWritables'
    import { felix_peak_detection } from '../../functions/svelteWritables'
    import { savefile, loadfile } from '../../functions/misc'
    import { NGauss_fit_func } from '../../functions/NGauss_fit'
    import { exp_fit_func } from '../../functions/exp_fit'
    import { dropRight, sortBy } from 'lodash-es'
    import computePy_func from '$lib/pyserver/computePy'
    import { Select, Switch, TextAndSelectOptsToggler, Textfield } from '$src/components'
    import { find_felix_opo_peaks } from '../../functions/utils'
    import SegBtn from '$src/components/SegBtn.svelte'
    // //////////////////////////////////////////////////////////////////////

    // export let normMethod: string
    export let showall = true
    export let fullfiles: string[]
    export let addedFileCol: string
    export let addedFileScale: number
    export let modalActivate = false
    export let adjustPeakTrigger = false
    export let output_namelists: string[] = []

    // let overwrite_expfit: boolean = true
    // let writeFile: boolean = false
    let writeFileName: string = 'averaged_normline.dat'

    // //////////////////////////////////////////////////////////////////////
    const uniqueID = getContext<string>('uniqueID')
    let NGauss_fit_args: { fitNGauss_arguments: { [name: string]: number }; index: number[] } = {
        fitNGauss_arguments: {},
        index: [],
    }
    let savePeakfilename = 'peakTable'
    let toggleFindPeaksRow = false
    let boxSelected_peakfinder = false
    let fitall = false

    $: currentGraph = $opoMode[uniqueID] ? `${uniqueID}-opoRelPlot` : `${uniqueID}-avgplot`

    const clearAllPeak = () => {
        // const graphElement = document.getElementById(currentGraph)

        // relayout(currentGraph, { annotations: [], shapes: [] })

        // const defaultLength = showall ? fullfiles.length : 1
        // const noOfFittedData = graphElement.data?.length - defaultLength
        if ($fittedTraceCount[uniqueID] === 0) {
            return window.createToast('No fitted lines found', 'danger')
        }
        // console.log('Removing all found peak values')
        // console.log({ noOfFittedData }, fullfiles.length, graphElement.data?.length)
        $felixIndex[uniqueID] = []
        $felixPlotAnnotations[uniqueID] = []
        $expfittedLines[uniqueID] = []

        relayout(currentGraph, { annotations: [], shapes: [] })

        for (let i = 0; i < $fittedTraceCount[uniqueID]; i++) {
            deleteTraces(currentGraph, [-1])
        }
        $fittedTraceCount[uniqueID] = 0
    }
    $: number_of_fitted_data = document.getElementById(currentGraph)?.data?.length - (showall ? fullfiles.length : 1)
    $: console.log('number_of_fitted_data', number_of_fitted_data)

    const clearLastPeak = () => {
        // const graphElement = document.getElementById(currentGraph)
        // const defaultLength = showall ? fullfiles.length : 1
        // const noOfFittedData = graphElement.data?.length - defaultLength
        if ($fittedTraceCount[uniqueID] === 0) {
            return window.createToast('No fitted lines found', 'danger')
        }
        $dataTable[uniqueID] = dropRight($dataTable[uniqueID], 1)
        $expfittedLines[uniqueID] = dropRight($expfittedLines[uniqueID], 2)
        $felixPlotAnnotations[uniqueID] = dropRight($felixPlotAnnotations[uniqueID], 1)
        relayout(currentGraph, {
            annotations: $felixPlotAnnotations[uniqueID],
            shapes: $expfittedLines[uniqueID],
        })

        deleteTraces(currentGraph, [-1])
        $fittedTraceCount[uniqueID] = $fittedTraceCount[uniqueID] - 1
        window.createToast('Last fitted peak removed', 'warning')
    }

    async function loadpeakTable() {
        const loadedfile = await loadfile(savePeakfilename, $felixopoLocation[uniqueID])
        if (loadedfile.length < 1) return
        $felixPeakTable[uniqueID] = sortBy(loadedfile, [(o) => o['freq']])
        adjustPeak()
    }

    function adjustPeak() {
        const annotationDefaults = {
            // xref: 'x',
            y: 'y',
            showarrow: true,
            arrowhead: 2,
            ax: -25,
            ay: -40,
            font: { color: 'black' },
            arrowcolor: 'black',
        }

        $felixPlotAnnotations[uniqueID] = $felixPeakTable[uniqueID].map((f) => {
            const { freq, amp } = f
            const annotate = {
                x: freq,
                y: amp,
                text: `(${freq.toFixed(2)}, ${amp.toFixed(2)})`,
            }
            return { ...annotationDefaults, ...annotate }
        })

        modalActivate = false
        relayout(currentGraph, { annotations: $felixPlotAnnotations[uniqueID] })
        adjustPeakTrigger = false
    }

    function plotData({ e = null, filetype = 'exp_fit', general = { pyfile: '', args: '' } } = {}) {
        if (filetype == 'general') {
            const { pyfile, args } = general
            computePy_func({ pyfile, args, general: true })
            return
        }

        switch (filetype) {
            case 'exp_fit':
                if (!$felixOutputName[uniqueID]) {
                    return window.createToast('Output name not found!!. Please select output filename', 'danger')
                }

                if ($felixIndex[uniqueID].length < 2) {
                    return window.createToast(
                        'Range not found!!. Select a range using Box-select tool in plotted graph',
                        'danger'
                    )
                }

                const expfit_args = {
                    fullfiles,
                    addedFileCol,
                    writeFileName,
                    addedFileScale,
                    normMethod: $normMethod[uniqueID],
                    index: $felixIndex[uniqueID],
                    location: $felixopoLocation[uniqueID],
                    output_name: $felixOutputName[uniqueID],
                    writeFile: write_controller.find((w) => w.name == 'Write').selected,
                    overwrite_expfit: write_controller.find((w) => w.name == 'Overwrite').selected,
                }

                computePy_func({
                    e,
                    pyfile: 'normline.exp_gauss_fit',
                    args: expfit_args,
                }).then((dataFromPython) => {
                    exp_fit_func({ dataFromPython, uniqueID })
                })
                break

            case 'NGauss_fit':
                if (!$felixOutputName[uniqueID]) {
                    return window.createToast('Output name not found!!. Please select output filename', 'danger')
                }
                if (boxSelected_peakfinder) {
                    if ($felixIndex[uniqueID].length < 2) {
                        window.createToast('Box selection is turned ON so please select a wn. range to fit', 'danger')
                        return
                    }

                    NGauss_fit_args.index = $felixIndex[uniqueID]
                } else {
                    NGauss_fit_args.index = []
                }

                if ($felixPeakTable[uniqueID].length === 0) {
                    return window.createToast('No arguments initialised yet.', 'danger')
                }

                NGauss_fit_args.fitNGauss_arguments = {}

                $felixPeakTable[uniqueID].forEach((f, index) => {
                    NGauss_fit_args.fitNGauss_arguments[`cen${index}`] = f.freq
                    NGauss_fit_args.fitNGauss_arguments[`A${index}`] = f.amp
                    NGauss_fit_args.fitNGauss_arguments[`sigma${index}`] = f.sig
                })
                NGauss_fit_args = {
                    ...NGauss_fit_args,
                    location: $felixopoLocation[uniqueID],
                    addedFileScale,
                    addedFileCol,
                    writeFile: write_controller.find((w) => w.name == 'Write').selected,
                    overwrite_expfit: write_controller.find((w) => w.name == 'Overwrite').selected,
                    writeFileName,
                    output_name: $felixOutputName[uniqueID],
                    fullfiles,
                    fitall,
                    normMethod: $normMethod[uniqueID],
                }

                computePy_func({
                    e,
                    pyfile: 'normline.multiGauss',
                    args: NGauss_fit_args,
                }).then((dataFromPython) => {
                    NGauss_fit_func({ dataFromPython, uniqueID })
                    if (dataFromPython[$normMethod[uniqueID]]) {
                        console.log('Line fitted')
                        window.createToast(
                            `Line fitted with ${
                                dataFromPython[$normMethod[uniqueID]]['fitted_parameter'].length
                            } gaussian function`,
                            'success'
                        )
                    }
                })

                break
            default:
                break
        }
    }
    $: if (adjustPeakTrigger) adjustPeak()

    let lookIn = ''
    onMount(async () => {
        lookIn = await path.resolve($felixopoLocation[uniqueID], '../EXPORT')
        felixIndex.init(uniqueID)
        felixPeakTable.init(uniqueID)
        felixOutputName.init(uniqueID)
        felixPlotAnnotations.init(uniqueID)
        return () => {
            felixIndex.remove(uniqueID)
            felixPeakTable.remove(uniqueID)
            felixOutputName.remove(uniqueID)
            felixPlotAnnotations.remove(uniqueID)
        }
    })

    const selected_files = async (files: string[]) => {
        $fileChecked[uniqueID] = await Promise.all(files.map(async (f) => await path.basename(f)))
    }

    $: selected_files(fullfiles)

    const dispatch = createEventDispatcher()

    let write_controller = [
        { name: 'Write', selected: false },
        { name: 'Overwrite', selected: true },
    ]
</script>

<div class="align" style="align-items: end;">
    <Select
        bind:value={$felixOutputName[uniqueID]}
        label="Select file to fit"
        options={output_namelists}
        on:change={() => {
            find_felix_opo_peaks({ uniqueID, toast: true })
        }}
    />

    <TextAndSelectOptsToggler
        toggle={false}
        bind:value={writeFileName}
        label="writeFileName"
        {lookIn}
        lookFor=".dat"
        auto_init={true}
    />

    <SegBtn bind:choices={write_controller} label="write/overwrite file" />
    <button class="button is-link" on:click={() => dispatch('addfile')}>Add files</button>
    <button class="button is-link" on:click={() => dispatch('removefile')}>Remove files</button>

    {#if $fittedTraceCount[uniqueID] > 0}
        <div class="ml-auto">
            <button class="button is-warning" on:click={clearLastPeak}>Clear Last</button>
            <button class="button is-danger" on:click={clearAllPeak}>
                <i
                    class="i-material-symbols-delete-forever-outline-rounded text-xs
                
                "
                />
                Clear All
            </button>
        </div>
    {/if}
</div>

<div class="align">
    <h3>Gaussian profile fitting</h3>
    <button class="button is-link" on:click={(e) => plotData({ e: e, filetype: 'exp_fit' })}>Fit 1-peak</button>
    <button class="button is-link" on:click={() => (toggleFindPeaksRow = !toggleFindPeaksRow)}>
        Fit N-peak(s)
        {#if toggleFindPeaksRow}
            <i class="i-mdi-keyboard-arrow-up" />
        {:else}
            <i class="i-mdi-keyboard-arrow-down" />
        {/if}
    </button>
</div>

{#if toggleFindPeaksRow}
    <div class="align">
        <Textfield
            on:change={() => find_felix_opo_peaks({ uniqueID })}
            style="width: 7em;"
            input$type="number"
            input$min="1"
            label="threshold intensity"
            bind:value={$felix_peak_detection[uniqueID].threshold}
        />

        <Textfield
            on:change={() => find_felix_opo_peaks({ uniqueID })}
            style="width: 5em;"
            input$type="number"
            input$min="1"
            label="peak width"
            bind:value={$felix_peak_detection[uniqueID].window}
        />
        <button class="button is-warning" on:click={() => find_felix_opo_peaks({ uniqueID, toast: true })}
            >Find peaks</button
        >

        <button style="width:7em" class="button is-link" on:click={(e) => plotData({ e: e, filetype: 'NGauss_fit' })}>
            Fit
        </button>

        <div class="ml-auto">
            <button class="button is-link" on:click={() => (modalActivate = true)}>Show peaks</button>
            {#if $felixPeakTable[uniqueID].length}
                <button
                    class="button is-danger"
                    on:click={() => {
                        $felixPlotAnnotations[uniqueID] = []
                        $felixPeakTable[uniqueID] = []
                        NGauss_fit_args = { fitNGauss_arguments: {}, index: [] }
                        relayout(currentGraph, { annotations: [] })
                        window.createToast('Cleared', 'warning')
                    }}
                >
                    <i
                        class="i-material-symbols-delete-forever-outline-rounded text-xs

                    "
                    />
                    Clear peaks
                </button>
            {/if}
        </div>
    </div>

    <div class="align">
        <Switch bind:selected={boxSelected_peakfinder} label="limited range" />
        <Switch bind:selected={fitall} label="fit all methods" />
        <TextAndSelectOptsToggler
            style="width: 7em;"
            bind:value={savePeakfilename}
            label="savefile"
            lookIn={$felixopoLocation[uniqueID]}
            lookFor=".json"
            auto_init={true}
        />

        <button
            class="button is-link"
            on:click={async () =>
                await savefile({
                    file: $felixPeakTable[uniqueID],
                    name: savePeakfilename,
                    location: $felixopoLocation[uniqueID],
                })}
        >
            Save peaks
        </button>
        <button class="button is-link" on:click={loadpeakTable}>Load peaks</button>
    </div>
{/if}
