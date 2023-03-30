<script lang="ts">
    import { showConfirm } from '$src/lib/alert/store'
    import Layout from '$src/layout/pages/Layout.svelte'
    import { Switch, ButtonBadge, STable, Textfield, RefreshButtons } from '$src/components'
    import GetLabviewSettings from '$lib/GetLabviewSettings.svelte'
    import Configs, { configs } from '$src/Pages/masspec/configs/Configs.svelte'
    import { plot } from '$src/js/functions'
    import { detectPeaks, readMassFile } from './masspec/mass'
    import computePy_func from '$lib/pyserver/computePy'
    import Database from './masspec/components/Database.svelte'
    import { DB_active, DB_window, DB } from './masspec/components/db/stores'
    import Select from '$src/components/Select.svelte'

    import colors from '$lib/misc/colors'
    import Checkbox from '$src/components/Checkbox.svelte'

    export let id = 'Masspec'
    export let display = 'grid'
    export let saveLocationToDB = false

    const filetype = 'mass'
    const uniqueID = `${id}-${window.getID()}`

    setContext('uniqueID', uniqueID)
    setContext('saveLocationToDB', saveLocationToDB)

    let fileChecked: string[] = []
    let currentLocation = ''

    const plotID = `${uniqueID}-mplot`
    const btnID = `${uniqueID}-masspec-plot-btn`

    let massfiles: string[] = []
    const update_massfiles = async (checked: string[]) => {
        if (!(await fs.exists(currentLocation))) return
        const files = checked.map(async (file) => await path.resolve(currentLocation, file))
        massfiles = await Promise.all(files)
        if (massfiles.length > 0) {
            await plotData()
            console.log('plotted')
        }
    }

    $: update_massfiles(fileChecked)

    let selected_file = ''

    let plotted_data: { [name: string]: { x: number[]; y: number[] } } = {}
    async function plotData({
        e = undefined,
        filetype = 'mass',
        overwride_file_limit_warning = false,
    }: {
        e?: ButtonClickEvent
        filetype?: 'mass' | 'general' | 'find_peaks'
        overwride_file_limit_warning?: boolean
    } = {}) {
        if (!overwride_file_limit_warning && fileChecked.length > $configs['max_files_to_plot'].value) {
            showConfirm.push({
                title: 'Too many files: safe limit is' + $configs['max_files_to_plot'].value,
                content: 'Do you want to plot ' + fileChecked.length + ' files?',
                callback: (response: string) => {
                    if (!response) return console.warn('response: ', response)
                    console.log(response)
                    if (response?.toLowerCase() === 'cancel') {
                        fileChecked = []
                        fileChecked = fullfileslist.slice(0, $configs['max_files_to_plot'].value)
                        console.log(fullfileslist)
                        return
                    }
                    plotData({
                        e,
                        filetype,
                        overwride_file_limit_warning: true,
                    })
                },
            })
            return
        }

        if (!(await fs.exists(currentLocation))) {
            return window.createToast('Location not defined', 'danger')
        }

        if (fileChecked.length < 1) {
            return window.createToast('No files selected', 'danger')
        }
        if (filetype === 'find_peaks') {
            if (selected_file === '') return window.createToast('No files selected', 'danger')
        }

        const pyfileInfo: { [name: string]: { pyfile: string; args: Object } } = {
            mass: { pyfile: 'mass', args: { massfiles, tkplot: 'run' } },
            general: { pyfile: 'mass', args: { massfiles, tkplot: 'plot' } },
        }

        const { pyfile, args } = pyfileInfo[filetype]
        if (filetype == 'general') {
            return computePy_func({ e, pyfile, args, general: true })
        }

        if (filetype == 'mass' && massfiles) {
            const dataFromPython = await readMassFile(massfiles, btnID)
            if (dataFromPython === null) return
            plot('Mass spectrum', 'm/z', 'Counts', dataFromPython, plotID, logScale, true)
            console.log({ dataFromPython, massfiles })

            for (const file in dataFromPython) {
                plotted_data[file] = { x: dataFromPython[file].x, y: dataFromPython[file].y }
            }
            peak_detection.filename = fileChecked.at(-1)
            return
        }
    }

    const normalize_data = () => {
        if (!normalize_wrt_mz) return
        const data = plotted_data[peak_detection.filename]
        const ind = data.x.findIndex((x) => x == Number(normalize_wrt_mz))
        peak_data = peak_data.map((peak) => {
            return { ...peak, ynorm: Number((peak.y / data.y[ind]).toFixed(fixed_digits ?? 2)) }
        })
    }
    const linearlogCheck = () => {
        const layout: Partial<Plotly.Layout> = {
            yaxis: { title: 'Counts', type: logScale ? 'log' : undefined },
        }
        const plotHTML = document.getElementById(plotID)
        if (plotHTML?.data) relayout(plotID, layout)
    }
    let fullfileslist: string[] = []
    let logScale = true
    let peak_detection = {
        threshold: 30,
        window: 4,
        filename: '',
    }
    let peak_data: { x: number; y: number; ynorm: number; id: string }[] = []

    const findPeaks = () => {
        const data = plotted_data[peak_detection.filename]
        const indices = detectPeaks({
            data: data.y,
            windowWidth: peak_detection.window,
            threshold: peak_detection.threshold,
        })

        if (indices.length < 1) return
        const peaks = {
            x: indices.map((i) => data.x[i]),
            y: indices.map((i) => data.y[i]),
        }

        normalize_wrt_mz = peaks.x[0]?.toString()
        if (!normalize_wrt_mz || isNaN(Number(normalize_wrt_mz))) return

        const ind = data.x.findIndex((x) => x == Number(normalize_wrt_mz))
        const normalized = data.y.map((y) => Number((y / data.y[ind]).toFixed(fixed_digits ?? 2)))
        peak_data = indices.map((i) => ({ x: data.x[i], y: data.y[i], ynorm: normalized[i], id: window.getID() }))

        const fileInd = fileChecked.findIndex((file) => file === peak_detection.filename)

        const shapes: Partial<Plotly.Shape>[] = indices.map((i) => {
            const x = data.x[i]
            const y = data.y[i]

            return {
                type: 'line',
                x0: x,
                y0: y,
                x1: x,
                y1: 1,
                line: {
                    color: `rgb${colors[fileInd]}`,
                    width: 1,
                    dash: 'dashdot',
                },
            }
        })
        relayout(plotID, { shapes })
    }

    $: if (include_peaks && peak_detection.filename && peak_detection.window && peak_detection.threshold) findPeaks()
    let normalize_wrt_mz = ''
    let IE = ''
    let fixed_digits = 2
    let peaks_file = ''

    $: peak_filename = `${peak_detection.filename?.replace('.mass', '')}_peaks_norm_w.r.t_${normalize_wrt_mz}mz${
        IE ? '_' + IE + 'eV' : ''
    }.txt`
    let saveloc = ''

    $: path.join(currentLocation, 'EXPORT').then(async (loc) => {
        saveloc = loc
        peaks_file = await path.join(saveloc, peak_filename)
    })

    const save_peak_data = async () => {
        let contents = `# m/z\tcounts\tnormalized\n`
        if (IE) contents += `# IE: ${IE} eV\n`

        peak_data.forEach((peak) => {
            contents += `${peak.x.toFixed(1)}\t${peak.y.toFixed(0)}\t${peak.ynorm}\n`
        })

        if (!(await fs.exists(saveloc))) {
            const [err] = await oO(fs.createDir(saveloc))
            if (err) return window.createToast(err as string, 'danger')
        }
        const [err] = await oO(fs.writeTextFile(peaks_file, contents))
        if (err) return window.createToast(err as string, 'danger')

        window.createToast(`${peak_filename} saved`, 'success')
    }

    let include_peaks = true
</script>

{#if saveLocationToDB}
    <Database filenames={fullfileslist} file_location={currentLocation} />
{/if}

<Layout {display} {filetype} {id} bind:currentLocation bind:fileChecked bind:fullfileslist>
    <svelte:fragment slot="toggle_row">
        <button
            aria-label={'Common masspectrum Database (FIS network)'}
            data-cooltipz-dir={'right'}
            class="button is-link"
            style="background-color: #ffb84c36;"
            on:click={() => {
                if ($DB && $DB_window) return $DB_window.maximize()
                $DB_active = true
            }}
        >
            <span>Database</span>
            <i class="i-mdi-database-arrow-down text-xs" />
        </button>
    </svelte:fragment>

    <svelte:fragment slot="buttonContainer">
        <div class="align" style="align-items: center;">
            <button class="button is-link" id={btnID} on:click={(e) => plotData({ e: e })}> Masspec Plot</button>
            <GetLabviewSettings {currentLocation} {fullfileslist} {fileChecked} />
            <ButtonBadge on:click={(e) => plotData({ e, filetype: 'general' })} label="Produce Figure" />
            <Switch style="margin: 0 1em;" on:change={linearlogCheck} bind:selected={logScale} label="Log" />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="plotContainer">
        <div id={plotID} class="graph__div" />

        {#if fileChecked.length > 0}
            <div class="align">
                <Switch
                    bind:selected={include_peaks}
                    label="peaks"
                    on:change={() => {
                        if (!include_peaks) relayout(plotID, { shapes: [] })
                    }}
                />
                <Select bind:value={peak_detection.filename} options={fileChecked} label="Select file to find peaks" />
                <Textfield
                    style="width: 7em;"
                    input$type="number"
                    input$min="1"
                    label="threshold count"
                    bind:value={peak_detection.threshold}
                />
                <Textfield
                    style="width: 5em;"
                    input$type="number"
                    input$min="1"
                    label="window size"
                    bind:value={peak_detection.window}
                />
                <Select
                    label="Normalize w.r.t"
                    options={peak_data.map((p) => `${p.x}`)}
                    bind:value={normalize_wrt_mz}
                    on:change={normalize_data}
                />
                <Textfield
                    input$min="0"
                    style="width: 5em;"
                    label="digits"
                    bind:value={fixed_digits}
                    input$type="number"
                    on:change={() => findPeaks()}
                />

                <Textfield style="width: 5em;" label="IE (eV)" bind:value={IE} />
                <RefreshButtons on:refresh={() => findPeaks()} />
            </div>

            <div class="save_file__div">
                <Textfield style="width: 100%;" label="peak save filename" value={peak_filename} disabled />
                <button class="i-material-symbols-save-rounded" on:click={async () => await save_peak_data()} />
                <button
                    class="i-material-symbols-folder-open-outline"
                    on:click={async () => {
                        if (!(await fs.exists(peaks_file))) return window.createToast(`File does not exist`, 'danger')
                        toast.promise(shell.open(peaks_file), {
                            loading: 'Opening file',
                            success: 'File opened',
                            error: 'Error opening file',
                        })
                    }}
                />
            </div>

            {#if include_peaks}
                <STable
                    rows={peak_data}
                    headKeys={['m/z', 'counts', `Normalized w.r.t m/z ${normalize_wrt_mz}`]}
                    rowKeys={['x', 'y', 'ynorm']}
                    sortable={true}
                />
            {/if}
        {/if}
    </svelte:fragment>

    <svelte:fragment slot="config">
        <div class="align">
            <Configs />
        </div>
    </svelte:fragment>
</Layout>

<style>
    .save_file__div {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
    }
</style>
