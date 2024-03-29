<script lang="ts">
    import {
        opoMode,
        normMethod,
        normMethods,
        Ngauss_sigma,
        felixopoLocation,
        felix_fulldata,
        OPO_fulldata,
        felix_peak_detection,
        graphPlotted,
    } from './normline/functions/svelteWritables'
    import {
        OPORow,
        TheoryRow,
        AddFilesToPlot,
        FrequencyTable,
        InitFunctionRow,
        GetFileInfoTable,
        AdjustInitialGuess,
        ExecuteFunctionContents,
    } from './normline'
    import { Select, Switch, Radio, SegBtn } from '$src/components'
    import Layout from '$src/layout/pages/Layout.svelte'
    import { plotlayout } from './normline/functions/plot_labels'
    import { dropRight } from 'lodash-es'

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

    let showTheory = true
    let OPOfilesChecked = []

    $: plottedFiles = $opoMode[uniqueID]
        ? OPOfilesChecked.map((file) => file.split('.')[0]) || []
        : fileChecked.map((file) => file.split('.')[0]) || []

    const update_output_namelists = async (_plottedFiles, _addedfiles) => {
        const files = _addedfiles.map(async (file) => await path.basename(file))
        const _extrafiles = await Promise.all(files)
        output_namelists = ['averaged', ..._plottedFiles, ..._extrafiles.map((file) => file.split('.')[0])]
    }
    let output_namelists = []
    $: update_output_namelists(plottedFiles, addedFile.files)

    let OPOLocation = localStorage.getItem('ofelix_location') || currentLocation
    let theoryLocation = localStorage.getItem('theoryLocation') || currentLocation
    let opofiles = []
    $: $felixopoLocation[uniqueID] = $opoMode[uniqueID] ? OPOLocation : currentLocation
    $: $Ngauss_sigma[uniqueID] = $opoMode[uniqueID] ? 2 : 5

    let addFileModal = false
    let addedFile = {
        files: [],
        col: '0, 1',
        scale: 1,
        N: 0,
        sep: 'tab',
    }

    $: currentGraphID = $opoMode[uniqueID] ? `${uniqueID}-opoRelPlot` : `${uniqueID}-avgplot`

    function removeExtraFile() {
        if (addedFile.files.length === 0) return
        deleteTraces(currentGraphID, [-1])
        addedFile.files = dropRight(addedFile.files)
    }

    let fullfiles: string[] = []

    const update_fullfiles = async (opofiles: string[], felixfiles: string[], addedfiles: string[]) => {
        const avgfile = await path.resolve(currentLocation, 'averaged')
        fullfiles = $opoMode[uniqueID] ? [...opofiles, ...addedfiles, avgfile] : [...felixfiles, ...addedfiles, avgfile]
    }
    $: update_fullfiles(opofiles, felixfiles, addedFile.files)

    let activateConfigModal = false
    let modalActivate = false
    let adjustPeakTrigger = false
    let plotfile = 'average'
    let showOPO = true
    let showFELIX = true
    let showRawData = true
    let showPowerData = true

    let show_graphs = [
        { name: 'Raw data', selected: true },
        { name: 'Power-Calib', selected: true },
        { name: 'FELIX', selected: true },
        { name: 'OPO', selected: false },
        { name: 'Theory', selected: false },
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
        felix_fulldata.init(uniqueID)
        OPO_fulldata.init(uniqueID)
        normMethod.init(uniqueID)
        felix_peak_detection.init(uniqueID)
        graphPlotted.init(uniqueID)

        mounted = true
        console.warn('Normline mounted')

        return () => {
            opoMode.remove(uniqueID)
            Ngauss_sigma.remove(uniqueID)
            felixopoLocation.remove(uniqueID)
            felix_fulldata.remove(uniqueID)
            OPO_fulldata.remove(uniqueID)
            normMethod.remove(uniqueID)
            felix_peak_detection.remove(uniqueID)
            graphPlotted.remove(uniqueID)
            console.warn('Normline destroyed')
        }
    })

    let felix_toggle = true
    let opo_toggle = true
    let theory_toggle = true
    let showall = true
    let theoryRow = false
    let graphWidth: number

    const demo_plot = () => {
        const { yaxis, xaxis, title } = plotlayout[$normMethod[uniqueID]]
        const dataLayout: Partial<Plotly.Layout> = {
            title,
            xaxis,
            yaxis,
            hovermode: 'closest',
            autosize: true,
            height: 450,
            width: graphWidth,
        }
        react(`${uniqueID}-avgplot`, [], dataLayout, { editable: true })

        $graphPlotted[uniqueID] = true
        window.createToast('Demo plotted', 'success')
    }
</script>

<AddFilesToPlot bind:addedFile bind:active={addFileModal} />
<AdjustInitialGuess bind:active={modalActivate} on:save={() => (adjustPeakTrigger = true)} />

<Layout
    {id}
    {display}
    {filetype}
    graphPlotted={$graphPlotted[uniqueID]}
    bind:fileChecked
    bind:currentLocation
    bind:activateConfigModal
>
    <svelte:fragment slot="toggle_row">
        {#if $opoMode[uniqueID]}
            <span class="tag" style="border: solid 1px; background-color: #ffa94d33;">OPO Mode</span>
        {/if}
        <div
            role="presentation"
            class="tag is-link"
            aria-label="show graph"
            data-cooltipz-dir="bottom"
            on:click={() => demo_plot()}
        >
            show graph
        </div>
    </svelte:fragment>

    <svelte:fragment slot="buttonContainer">
        <InitFunctionRow
            {theoryLocation}
            bind:theoryRow
            {felixfiles}
            {plotfile}
            class={felix_toggle && mounted ? '' : 'hide'}
            {showall}
            on:opoMode={(e) => (show_graphs[3].selected = e.detail)}
            on:theoryMode={(e) => (show_graphs[4].selected = e.detail)}
        />
        <OPORow
            {showall}
            bind:OPOLocation
            bind:OPOfilesChecked
            bind:opofiles
            {plotfile}
            class={opo_toggle ? '' : 'hide'}
        />

        <TheoryRow bind:theoryLocation class={theory_toggle ? '' : 'hide'} {theoryRow} />

        <div class="align" class:hide={!felix_toggle}>
            <Radio bind:value={$normMethod[uniqueID]} options={normMethods} />
            <div class="flex flex-row ml-auto">
                <div style="display: flex; gap: 0.5em;">
                    <Switch bind:selected={showall} label="plot-all-files" />
                    {#if !showall}
                        <Select bind:value={plotfile} label="plotfile" options={plotfileOptions} />
                    {/if}
                </div>
                <SegBtn bind:choices={show_graphs} label="select plots to include" />
            </div>
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
            <div bind:clientWidth={graphWidth} id="{uniqueID}-avgplot" class="graph__div" />
        </div>

        <div id="{uniqueID}-opo_graphs" class:hide={!showOPO}>
            <div class="graph__div" class:hide={!showRawData} id="{uniqueID}-opoplot" />
            <div class="graph__div" class:hide={!showRawData} id="{uniqueID}-opoSA" />
            <div class="graph__div" id="{uniqueID}-opoRelPlot" />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="config">
        <GetFileInfoTable {felixfiles} {opofiles} />
    </svelte:fragment>

    <svelte:fragment slot="plotContainer_functions">
        <ExecuteFunctionContents
            bind:modalActivate
            bind:adjustPeakTrigger
            {fullfiles}
            {output_namelists}
            on:addfile={() => {
                addFileModal = true
            }}
            {addedFile}
            on:removefile={removeExtraFile}
        />
    </svelte:fragment>
    <svelte:fragment slot="plotContainer_reports">
        <FrequencyTable />
    </svelte:fragment>
</Layout>

<style>
    .graph__div {
        margin-bottom: 1em;
    }
</style>
