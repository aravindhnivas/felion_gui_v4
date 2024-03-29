<script lang="ts">
    import { Textfield, Switch, Select, ButtonBadge } from '$src/components'
    import Layout from '$src/layout/pages/Layout.svelte'
    import { plot } from '../js/functions'
    import computePy_func from '$lib/pyserver/computePy'
    import MenuSurface from '@smui/menu-surface'
    import type { MenuSurfaceComponentDev } from '@smui/menu-surface'
    import { persistentWritable } from '$src/js/persistentStore'
    /////////////////////////////////////////////////////////////////////////
    let surface: MenuSurfaceComponentDev

    export let id = 'Timescan'
    export let display = 'grid'
    export let saveLocationToDB = true

    const filetype = 'scan'
    const uniqueID = `${id}-${window.getID()}`

    setContext('uniqueID', uniqueID)
    setContext('saveLocationToDB', saveLocationToDB)

    let fileChecked: string[] = []
    let currentLocation = ''
    const update_file = async (_loc: string, _filename: string[]) => {
        const files = _filename.map(async (file) => await path.resolve(currentLocation, file))
        scanfiles = await Promise.all(files)
    }
    let scanfiles: string[] = []
    $: update_file(currentLocation, fileChecked)

    let nshots = 10
    let power = '21, 21'
    let massIndex = 0
    let fullfiles: string[] = []
    let resON_Files = ''
    let graphPlotted = false
    let resOFF_Files = ''
    let timestartIndex = 1
    let timestartIndexScan = 0

    async function dir_changed() {
        if (!(await fs.exists(currentLocation))) return console.error('Not a directory')

        const [_err, dirRead] = await oO(fs.readDir(currentLocation))
        if (_err) return window.handleError(_err)

        fullfiles = dirRead.map((f) => f.name).filter((file) => file.endsWith('.scan'))
    }

    $: console.log(`ResOn: ${resON_Files}\nResOff: ${resOFF_Files}`)

    // Depletion Row
    let toggleRow = true
    let logScale = false
    let dataLength = 1
    let timescanData = {}

    function sliceData(modifyData) {
        const reduceData = structuredClone(modifyData)

        Object.keys(reduceData).forEach((data) => {
            Object.keys(reduceData[data]).forEach((innerData) => {
                const newData = reduceData[data][innerData]
                newData.x = newData.x.slice(timestartIndexScan, dataLength)
                newData.y = newData.y.slice(timestartIndexScan, dataLength)
                newData['error_y']['array'] = newData['error_y']['array'].slice(timestartIndexScan, dataLength)
                reduceData[data][innerData] = newData
            })
        })

        return structuredClone(reduceData)
    }

    async function plotData({ e = null, filetype = 'scan', tkplot = 'run' } = {}) {
        if (fileChecked.length === 0 && filetype === 'scan') {
            return window.createToast('No files selected', 'danger')
        }

        if (filetype === 'general') {
            if (resOFF_Files === '' || resON_Files === '') {
                return window.createToast('No files selected', 'danger')
            }
        }

        const depletionArgs = {
            currentLocation,
            resON_Files,
            resOFF_Files,
            power,
            nshots,
            massIndex,
            timestartIndex,
            saveOutputDepletion,
            $depletionplot_figure_kwargs,
        }

        const pyfileInfo = {
            scan: { pyfile: 'timescan', args: { scanfiles, tkplot } },
            general: { pyfile: 'depletionscan', args: depletionArgs },
        }
        const { pyfile, args } = pyfileInfo[filetype]
        console.log({ filetype, pyfile, args })
        if (filetype == 'scan') {
            console.log(`Plotting ${tkplot} scan`)
            graphPlotted = false
            if (tkplot == 'plot') {
                return computePy_func({ e, pyfile, args, general: true })
            }
        }

        if (filetype == 'general') {
            return computePy_func({ e, pyfile, args, general: true })
        }

        try {
            const dataFromPython = await computePy_func({ e, pyfile, args })
            if (!dataFromPython) return

            if (filetype == 'scan') {
                Object.keys(dataFromPython).forEach((data) => {
                    Object.keys(dataFromPython[data]).forEach((innerData) => {
                        dataLength = dataFromPython[data][innerData].x.length
                    })
                })
                timescanData = sliceData(dataFromPython)
                kineticData = sliceData(dataFromPython)

                fileChecked.forEach((file) => {
                    plot(
                        `Timescan Plot: ${file}`,
                        'Time (in ms)',
                        'Counts',
                        timescanData[file],
                        `${uniqueID}-${file}_tplot`,
                        logScale
                    )
                })
            }
            graphPlotted = true
        } catch (error) {
            window.handleError(error)
        }
    }

    const linearlogCheck = () => {
        const layout: Partial<Plotly.Layout> = {
            yaxis: { title: 'Counts', type: logScale ? 'log' : null },
        }

        if (graphPlotted) {
            fileChecked.forEach((file) => {
                let tplot = `${uniqueID}-${file}_tplot`
                const id = document.getElementById(tplot) as Plotly.PlotlyHTMLElement
                if (id?.data) {
                    relayout(id, layout)
                }
            })
        }
    }

    let kineticData = {}

    async function updateData() {
        kineticData = sliceData(timescanData)

        fileChecked.forEach((file) => {
            plot(
                `Timescan Plot: ${file}`,
                'Time (in ms)',
                'Counts',
                kineticData[file],
                `${uniqueID}-${file}_tplot`,
                logScale
            )
        })
    }

    let saveOutputDepletion = true
    // let display = window.db.get('active_tab') === id ? 'block' : 'none'

    const depletionplot_figure_kwargs = persistentWritable('depletionplot_figure_kwargs', { rows_cols: '1, 2' })
</script>

<Layout {filetype} {graphPlotted} {id} {display} bind:currentLocation bind:fileChecked on:chdir={dir_changed}>
    <svelte:fragment slot="buttonContainer">
        <div class="align " style="align-items: center;">
            <button class="button is-link" on:click={(e) => plotData({ e: e })}>Timescan Plot</button>
            <Textfield
                type="number"
                input$min="0"
                input$max={dataLength}
                bind:value={timestartIndexScan}
                label="Time Index"
                on:change={updateData}
            />
            <button
                class="button is-link"
                on:click={() => {
                    toggleRow = !toggleRow
                }}>Depletion Plot</button
            >
            <ButtonBadge
                on:click={(e) => plotData({ e: e, filetype: 'scan', tkplot: 'plot' })}
                label="Produce Figure"
            />
            <Switch on:change={linearlogCheck} bind:selected={logScale} label="Log" />
        </div>

        <div class="align animate__animated animate__fadeIn" class:hide={toggleRow}>
            <Select bind:value={resON_Files} label="ResOn" options={fullfiles} />
            <Select bind:value={resOFF_Files} label="ResOFF" options={fullfiles} />

            <Textfield bind:value={power} label="Power (ON, OFF) [mJ]" />

            <Textfield type="number" bind:value={nshots} label="FELIX Hz" />
            <Textfield type="number" bind:value={massIndex} label="Mass Index" />
            <Textfield type="number" bind:value={timestartIndex} label="Time Index" />
            <Switch bind:selected={saveOutputDepletion} label="save_output" />

            <div class="figure_controller__div">
                <MenuSurface
                    class="p-3"
                    style="background: var(--background-color); min-width: 200px;"
                    bind:this={surface}
                    anchorCorner="BOTTOM_START"
                >
                    <Textfield bind:value={$depletionplot_figure_kwargs['rows_cols']} label="subplot (rows, cols)" />
                </MenuSurface>
                <button class="i-mdi-settings" on:click={() => surface.setOpen(true)} />
            </div>
            <ButtonBadge on:click={(e) => plotData({ e: e, filetype: 'general' })}>Submit</ButtonBadge>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="plotContainer" let:lookForGraph>
        {#each fileChecked as scanfile}
            <div id="{uniqueID}-{scanfile}_tplot" class="graph__div" use:lookForGraph />
        {/each}
    </svelte:fragment>
</Layout>
