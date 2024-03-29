<script lang="ts">
    import { opoMode, felixPlotAnnotations, normMethod, OPO_fulldata } from '../../functions/svelteWritables'
    import { felix_opo_func } from '../../functions/felix_opo_func'
    import plotIndividualDataIntoGraph from '../../functions/plotIndividualDataIntoGraph'
    import { Select, QuickBrowser, TextSwitch, BrowseTextfield } from '$src/components'
    import { plot } from '$src/js/functions'
    import computePy_func from '$lib/pyserver/computePy'
    import { plotlayout } from '../../functions/plot_labels'

    /////////////////////////////////////////////////////////////////////////

    export let plotfile: string
    export let opofiles: string[]
    export let OPOLocation: string
    // export let removeExtraFile: VoidFunction
    export let OPOfilesChecked: string[]
    export let showall = true
    // export let normMethod: string

    let className = ''
    export { className as class }
    /////////////////////////////////////////////////////////////////////////

    let opoPower = 1
    let deltaOPO = 0.3

    const uniqueID = getContext<string>('uniqueID')
    let calibFile = ''
    let showOPOFiles = false
    let OPOcalibFiles = []

    const update_opo_files = async (loc: string, files: string[]) => {
        if (!(await fs.exists(loc))) return
        const dirs = await fs.readDir(loc)
        OPOcalibFiles = dirs.map((f) => f.name).filter((file) => file.endsWith('.calibOPO'))
        opofiles = await Promise.all(files.map(async (file) => await path.resolve(loc, file)))
    }

    $: update_opo_files(OPOLocation, OPOfilesChecked)

    let dataReady = false

    function plotData({ e = null, tkplot = 'run', general = false } = {}) {
        // removeExtraFile()

        if (opofiles.length < 1) return window.createToast('No OPO files selected', 'danger')
        $felixPlotAnnotations[uniqueID] = []

        const args = { opofiles, tkplot, $deltaOPO: deltaOPO, calibFile, opoPower }
        if (general)
            return computePy_func({
                e,
                pyfile: 'normline.oposcan',
                args,
                general,
            })

        dataReady = false

        computePy_func({ e, pyfile: 'normline.oposcan', args, general }).then((dataFromPython) => {
            $OPO_fulldata[uniqueID] = dataFromPython as OPOData
            dataReady = true
            // $opoMode[uniqueID] = true
            showOPOFiles = false
        })
    }

    $: updateplot = dataReady && plotfile && $normMethod[uniqueID] && $OPO_fulldata[uniqueID] && $opoMode[uniqueID]
    $: if (updateplot && showall) {
        if (currentGraph.hasAttribute('data-plotted')) {
            // const currentKey = mapNormMethodKeys[normMethod]
            // const currentData = get_data($OPO_fulldata[uniqueID][currentKey])
            // react(`${uniqueID}-opoRelPlot`, currentData, plotlayout[normMethod])
            const { yaxis, xaxis, title, key } = plotlayout[$normMethod[uniqueID]]
            plot(title, xaxis.title, yaxis.title, $OPO_fulldata[uniqueID][key], `${uniqueID}-opoRelPlot`)
            plot(
                'Baseline Corrected',
                'Wavelength (cm-1)',
                'Counts',
                $OPO_fulldata[uniqueID]['base'],
                `${uniqueID}-opoplot`
            )
            plot(
                'OPO Calibration',
                'Set Wavenumber (cm-1)',
                'Measured Wavenumber (cm-1)',
                $OPO_fulldata[uniqueID]['SA'],
                `${uniqueID}-opoSA`
            )
        } else {
            felix_opo_func({ uniqueID, mode: 'opo' })
        }
    } else if (updateplot) {
        plotIndividualDataIntoGraph({
            plotfile,
            uniqueID,
        })
    }

    let currentGraph: HTMLElement

    onMount(() => {
        currentGraph = document.getElementById(`${uniqueID}-opoRelPlot`)
    })
</script>

<QuickBrowser
    title="OPO files"
    filetype="ofelix"
    bind:active={showOPOFiles}
    bind:currentLocation={OPOLocation}
    bind:fileChecked={OPOfilesChecked}
    on:submit={(e) => {
        plotData({ e: e.detail.event })
    }}
/>

{#if $opoMode[uniqueID]}
    <div class="align box p-2 {className}" style="background-color: #ffa94d33;">
        <BrowseTextfield class="p-1 two_col_browse" bind:value={OPOLocation} label="OPO location" />
        {#await fs.exists(OPOLocation) then isExist}
            {#if isExist}
                <div class="align">
                    <button
                        class="button is-warning"
                        on:click={() => {
                            showOPOFiles = !showOPOFiles
                        }}
                    >
                        Show files</button
                    >
                    <Select bind:value={calibFile} label="Calib. file" options={OPOcalibFiles} />
                    <TextSwitch
                        style="width:7em;"
                        step="0.1"
                        variant="outlined"
                        bind:value={deltaOPO}
                        label="Delta OPO"
                    />
                    <TextSwitch
                        style="width:9em"
                        step="0.1"
                        variant="outlined"
                        bind:value={opoPower}
                        label="Power (mJ)"
                    />
                    <button class="button is-link" on:click={(e) => plotData({ e })}>Replot</button>
                </div>
            {/if}
        {/await}
    </div>
{/if}
