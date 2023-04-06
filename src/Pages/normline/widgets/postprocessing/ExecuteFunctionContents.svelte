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

    export let fullfiles: string[]
    export let modalActivate = false
    export let adjustPeakTrigger = false
    export let addedFile: { files: string[]; col: string; scale: number; N: number } = null
    export let output_namelists: string[] = []

    // //////////////////////////////////////////////////////////////////////
    const uniqueID = getContext<string>('uniqueID')

    let writeFileName: string = 'averaged_normline.dat'
    let NGauss_fit_args: {
        fitNGauss_arguments: { [name: string]: number }
        index: number[]
        location: string
        addedFileScale: number
        addedFileCol: string
        writeFile: boolean
        overwrite_expfit: boolean
        writeFileName: string
        output_name: string
        fullfiles: string[]
        fitall: boolean
        normMethod: string
    } = {
        fitNGauss_arguments: {},
        index: [],
        location: '',
        addedFileScale: 1,
        addedFileCol: '',
        writeFile: false,
        overwrite_expfit: true,
        writeFileName: '',
        output_name: '',
        fullfiles: [],
        fitall: false,
        normMethod: '',
    }
    let savePeakfilename = 'peakTable'
    let toggleFindPeaksRow = false
    let boxSelected_peakfinder = false
    let fitall = false

    $: currentGraph = $opoMode[uniqueID] ? `${uniqueID}-opoRelPlot` : `${uniqueID}-avgplot`

    const clearAllPeak = () => {
        if ($fittedTraceCount[uniqueID] === 0) {
            return window.createToast('No fitted lines found', 'danger')
        }

        $felixIndex[uniqueID] = []
        $felixPlotAnnotations[uniqueID] = []
        $expfittedLines[uniqueID] = []

        relayout(currentGraph, { annotations: [], shapes: [] })

        for (let i = 0; i < $fittedTraceCount[uniqueID]; i++) {
            deleteTraces(currentGraph, [-1])
        }
        $fittedTraceCount[uniqueID] = 0
    }

    const clearLastPeak = () => {
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

    async function plotData({ e = null, filetype = 'exp_fit', general = { pyfile: '', args: '' } } = {}) {
        if (filetype == 'general') {
            const { pyfile, args } = general
            await computePy_func({ pyfile, args, general: true })
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
                    writeFile,
                    fullfiles,
                    writeFileName,
                    overwrite_expfit,
                    addedFileCol: addedFile.col,
                    addedFileScale: addedFile.scale,
                    normMethod: $normMethod[uniqueID],
                    index: $felixIndex[uniqueID],
                    location: $felixopoLocation[uniqueID],
                    output_name: $felixOutputName[uniqueID],
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
                // const filename = fullfiles.findIndex((f) => f.includes($felixOutputName[uniqueID]))

                $felixPeakTable[uniqueID].forEach((f, index) => {
                    NGauss_fit_args.fitNGauss_arguments[`cen${index}`] = f.freq
                    NGauss_fit_args.fitNGauss_arguments[`A${index}`] = f.amp
                    NGauss_fit_args.fitNGauss_arguments[`sigma${index}`] = f.sig
                })
                NGauss_fit_args = {
                    ...NGauss_fit_args,
                    location: $felixopoLocation[uniqueID],
                    addedFileCol: addedFile.col,
                    addedFileScale: addedFile.scale,
                    writeFile,
                    overwrite_expfit,
                    writeFileName,
                    output_name: $felixOutputName[uniqueID],
                    fullfiles,
                    fitall,
                    normMethod: $normMethod[uniqueID],
                }

                computePy_func<NGaussDataObjType>({
                    e,
                    pyfile: 'normline.multiGauss',
                    args: NGauss_fit_args,
                }).then((dataFromPython) => {
                    if (!dataFromPython?.[$normMethod[uniqueID]]) return
                    NGauss_fit_func({ dataFromPython, uniqueID })

                    window.createToast(
                        `Line fitted with ${
                            dataFromPython[$normMethod[uniqueID]]['fitted_parameter'].length
                        } gaussian function`,
                        'success'
                    )
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

    $: writeFile = write_controller.find((w) => w.name == 'Write').selected
    $: overwrite_expfit = write_controller.find((w) => w.name == 'Overwrite').selected
    let show_fitting_div = false
</script>

<div class="align" style="align-items: end;">
    {#if show_fitting_div}
        <Select
            bind:value={$felixOutputName[uniqueID]}
            label="Select file to fit"
            options={output_namelists}
            on:change={async () => {
                await find_felix_opo_peaks({ uniqueID, toast: false, addedFile })
            }}
        />

        <SegBtn bind:choices={write_controller} label="write/overwrite file" />

        {#if writeFile}
            <TextAndSelectOptsToggler
                toggle={false}
                bind:value={writeFileName}
                label="writeFileName"
                {lookIn}
                lookFor=".dat"
                auto_init={true}
            />
        {/if}
    {/if}
    <div class="ml-auto">
        <button class="button is-link" on:click={() => (show_fitting_div = !show_fitting_div)}
            >Line profile fitting
            {#if show_fitting_div}
                <i class="i-mdi-keyboard-arrow-up" />
            {:else}
                <i class="i-mdi-keyboard-arrow-down" />
            {/if}
        </button>

        <button class="button is-link" on:click={() => dispatch('addfile')}
            >Add file <i class="ml-2 i-material-symbols-add-box text-xs" /></button
        >
        {#if addedFile.files.length > 0}
            <button class="button is-danger" on:click={() => dispatch('removefile')}>Remove file</button>
        {/if}
    </div>
</div>

{#if show_fitting_div}
    <div class="align">
        <button class="button is-link" on:click={(e) => plotData({ e: e, filetype: 'exp_fit' })}>Fit 1-peak</button>
        <button class="button is-link" on:click={() => (toggleFindPeaksRow = !toggleFindPeaksRow)}>
            Fit N-peak(s)
            {#if toggleFindPeaksRow}
                <i class="i-mdi-keyboard-arrow-up" />
            {:else}
                <i class="i-mdi-keyboard-arrow-down" />
            {/if}
        </button>

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

    {#if toggleFindPeaksRow}
        <span class="tag is-warning" style="width: 50rem;"
            >Use "Find peaks" AND/OR ctrl + left-click on the plot peak area to include the peak(s) for fitting</span
        >

        <div class="align">
            <Textfield
                on:change={async () => await find_felix_opo_peaks({ uniqueID, addedFile })}
                style="width: 7em;"
                input$type="number"
                input$min="1"
                label="threshold intensity"
                bind:value={$felix_peak_detection[uniqueID].threshold}
            />

            <Textfield
                on:change={async () => await find_felix_opo_peaks({ uniqueID, addedFile })}
                style="width: 5em;"
                input$type="number"
                input$min="1"
                label="peak width"
                bind:value={$felix_peak_detection[uniqueID].window}
            />
            <button
                class="button is-warning"
                on:click={async () => await find_felix_opo_peaks({ uniqueID, addedFile, toast: true })}
                >Find peaks</button
            >

            <button
                style="width:7em"
                class="button is-link"
                on:click={(e) => plotData({ e: e, filetype: 'NGauss_fit' })}
            >
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
{/if}
