<script lang="ts">
    import { opoMode, normMethods, Ngauss_sigma, felixopoLocation } from './normline/functions/svelteWritables'

    import AddFilesToPlot from './normline/modals/AddFilesToPlot.svelte'
    import FrequencyTable from './normline/components/FrequencyTable.svelte'
    import InitFunctionRow from './normline/widgets/preprocessing/InitFunctionRow.svelte'
    import OPORow from './normline/widgets/preprocessing/OPORow.svelte'
    import AdjustInitialGuess from './normline/modals/AdjustInitialGuess.svelte'
    import TheoryRow from './normline/widgets/preprocessing/TheoryRow.svelte'
    import GetFileInfoTable from './normline/widgets/preprocessing/GetFileInfoTable.svelte'
    import WriteFunctionContents from './normline/widgets/postprocessing/WriteFunctionContents.svelte'
    import ExecuteFunctionContents from './normline/widgets/postprocessing/ExecuteFunctionContents.svelte'

    import Select from '$components/Select.svelte'
    import Switch from '$components/Switch.svelte'
    import Layout from '$src/layout/pages/Layout.svelte'
    import Radio from '$src/components/Radio.svelte'
    import SegBtn from '$src/components/SegBtn.svelte'

    import { deleteTraces } from 'plotly.js-basic-dist'
    import { path } from '@tauri-apps/api'
    ///////////////////////////////////////////////////////////////////////

    export let id = 'Normline'
    export let display = 'grid'
    export let saveLocationToDB = true

    const filetype = 'felix'
    const uniqueID = `${id}-${window.getID()}`

    setContext('uniqueID', uniqueID)
    setContext('saveLocationToDB', saveLocationToDB)

    let fileChecked = []
    let currentLocation = ''

    const update_felixfiles = async (_files: string[], _loc: string) => {
        felixfiles = await Promise.all(_files.map(async (f) => await path.resolve(_loc, f)))
    }
    let felixfiles: string[] = []
    $: update_felixfiles(fileChecked, currentLocation)

    ///////////////////////////////////////////////////////////////////////
    let showTheory = true
    let graphPlotted = false
    let overwrite_expfit = true
    let writeFile = true
    let OPOfilesChecked = []
    let writeFileName = 'average_normline.dat'

    $: plottedFiles = $opoMode[uniqueID]
        ? OPOfilesChecked.map((file) => file.split('.')[0]) || []
        : fileChecked.map((file) => file.split('.')[0]) || []

    const update_output_namelists = async (_plottedFiles, _addedfiles) => {
        const files = _addedfiles.map(async (file) => await path.basename(file))
        const _extrafiles = await Promise.all(files)
        output_namelists = ['averaged', ..._plottedFiles, ..._extrafiles.map((file) => file.split('.')[0])]
    }
    let output_namelists = []
    $: update_output_namelists(plottedFiles, addedfiles)

    // OPO
    let OPOLocation = localStorage.getItem('ofelix_location') || currentLocation
    let opofiles = []

    let theoryLocation = localStorage.getItem('theoryLocation') || currentLocation

    $: $felixopoLocation[uniqueID] = $opoMode[uniqueID] ? OPOLocation : currentLocation
    $: $Ngauss_sigma[uniqueID] = $opoMode[uniqueID] ? 2 : 5

    let addFileModal = false

    let addedFile = {
        files: [],
        col: '0, 1',
        scale: 1,
        N: 0,
    }
    let addedfiles = []
    let addedFileCol = '0, 1'
    let addedFileScale = 1
    let extrafileAdded = 0

    $: currentGraphID = $opoMode[uniqueID] ? `${uniqueID}-opoRelPlot` : `${uniqueID}-avgplot`

    $: console.log(`Extrafile added: ${extrafileAdded}`)

    function removeExtraFile() {
        // console.log(extrafileAdded)
        if (extrafileAdded === 0) return
        for (let i = 0; i < extrafileAdded + 1; i++) {
            try {
                deleteTraces(currentGraphID, [-1])
                extrafileAdded--
                addedfiles = addedfiles.slice(0, addedfiles.length - 1)
            } catch (err) {
                console.warn(err, 'Could not delete trace')
            }
        }
    }
    let fullfiles: string[] = []
    const update_fullfiles = async (mode) => {
        const avgfile = await path.resolve(currentLocation, 'averaged.felix')
        fullfiles = mode ? [...opofiles, ...addedfiles, avgfile] : [...felixfiles, ...addedfiles, avgfile]
    }
    $: update_fullfiles($opoMode[uniqueID])

    let activateConfigModal = false
    let modalActivate = false
    let adjustPeakTrigger = false

    let plotfile = 'average'

    // let showMoreOptions = false

    let showOPO = true
    let showFELIX = true
    let showRawData = true
    let showPowerData = true

    let show_graphs = [
        { name: 'Raw data', selected: true },
        { name: 'Power-Calib', selected: true },
        { name: 'FELIX', selected: true },
        { name: 'OPO', selected: true },
        { name: 'Theory', selected: true },
    ]
    $: if (show_graphs) {
        showFELIX = show_graphs.find((graph) => graph.name === 'FELIX').selected
        showOPO = show_graphs.find((graph) => graph.name === 'OPO').selected
        showTheory = show_graphs.find((graph) => graph.name === 'Theory').selected
        showRawData = show_graphs.find((graph) => graph.name === 'Raw data').selected
        showPowerData = show_graphs.find((graph) => graph.name === 'Power-Calib').selected
    }

    $: plotfileOptions = $opoMode[uniqueID] ? [...OPOfilesChecked, 'average'] : [...fileChecked, 'average']

    let mounted = false
    onMount(() => {
        opoMode.init(uniqueID)
        Ngauss_sigma.init(uniqueID)
        felixopoLocation.init(uniqueID)
        mounted = true
        console.warn('Normline mounted')
    })
    onDestroy(() => {
        opoMode.remove(uniqueID)
        Ngauss_sigma.remove(uniqueID)
        felixopoLocation.remove(uniqueID)
        console.warn('Normline destroyed')
    })

    let felix_toggle = true
    let opo_toggle = true
    let theory_toggle = true

    let showall = true
    let normMethod: string = normMethods[1]
    let theoryRow = false
</script>

<AddFilesToPlot
    {fileChecked}
    bind:addedfiles
    bind:addedFile
    bind:addedFileCol
    bind:addedFileScale
    bind:extrafileAdded
    bind:active={addFileModal}
/>

<AdjustInitialGuess bind:active={modalActivate} on:save={() => (adjustPeakTrigger = true)} />

<Layout {id} {display} {filetype} {graphPlotted} bind:fileChecked bind:currentLocation bind:activateConfigModal>
    <svelte:fragment slot="toggle_row">
        {#if $opoMode[uniqueID]}
            <span class="tag" style="border: solid 1px; background-color: #ffa94d33;">OPO Mode</span>
        {/if}
    </svelte:fragment>

    <svelte:fragment slot="buttonContainer">
        <InitFunctionRow
            {theoryLocation}
            {normMethod}
            bind:theoryRow
            {removeExtraFile}
            {felixfiles}
            {plotfile}
            class={felix_toggle && mounted ? '' : 'hide'}
            {showall}
        />
        <OPORow
            {normMethod}
            {showall}
            {removeExtraFile}
            bind:OPOLocation
            bind:OPOfilesChecked
            bind:opofiles
            {plotfile}
            class={opo_toggle ? '' : 'hide'}
        />
        <TheoryRow bind:theoryLocation {normMethod} class={theory_toggle ? '' : 'hide'} {theoryRow} />
        <div class="align" class:hide={!felix_toggle}>
            <Radio bind:value={normMethod} options={normMethods} />
        </div>

        <div class="align">
            <div style="display: flex; gap: 0.5em;">
                <Switch bind:selected={showall} label="plot-all-files" />
                {#if !showall}
                    <Select bind:value={plotfile} label="plotfile" options={plotfileOptions} />
                {/if}
            </div>
            <SegBtn class="ml-auto" bind:choices={show_graphs} />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="plotContainer">
        <div
            class="animate__animated animate__fadeIn graph__div"
            class:hide={!showTheory}
            id="{uniqueID}-exp-theory-plot"
        />
        <div id="{uniqueID}-felix_graphs" class:hide={!showFELIX}>
            <div id="{uniqueID}-bplot" class="graph__div" class:hide={!showRawData} />
            <div id="{uniqueID}-saPlot" class="graph__div" class:hide={!showPowerData} />
            <div
                id="{uniqueID}-avgplot"
                class="graph__div"
                on:plotted={(e) => {
                    if (e.detail.graphDiv === `${uniqueID}-avgplot`) {
                        graphPlotted = true
                    }
                }}
            />
        </div>

        <div id="{uniqueID}-opo_graphs" class:hide={!showOPO}>
            <div
                class="animate__animated animate__fadeIn graph__div"
                class:hide={!showRawData}
                id="{uniqueID}-opoplot"
            />
            <div class="animate__animated animate__fadeIn graph__div" class:hide={!showRawData} id="{uniqueID}-opoSA" />
            <div
                class="animate__animated animate__fadeIn graph__div"
                id="{uniqueID}-opoRelPlot"
                on:plotted={(e) => {
                    if (e.detail.graphDiv === `${uniqueID}-opoRelPlot`) {
                        graphPlotted = true
                    }
                }}
            />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="config">
        <GetFileInfoTable {felixfiles} {opofiles} {normMethod} />
    </svelte:fragment>

    <svelte:fragment slot="plotContainer_functions">
        <WriteFunctionContents
            on:addfile={() => {
                addFileModal = true
            }}
            on:removefile={removeExtraFile}
            {output_namelists}
            bind:writeFileName
            bind:writeFile
            bind:overwrite_expfit
        />

        <ExecuteFunctionContents
            {normMethod}
            {showall}
            bind:modalActivate
            bind:adjustPeakTrigger
            {...{
                fullfiles,
                writeFile,
                addedFileCol,
                writeFileName,
                addedFileScale,
                overwrite_expfit,
            }}
        />
    </svelte:fragment>
    <svelte:fragment slot="plotContainer_reports">
        <FrequencyTable {normMethod} />
    </svelte:fragment>
</Layout>

<style lang="scss">
    .graph__div {
        margin-bottom: 1em;
    }
</style>
