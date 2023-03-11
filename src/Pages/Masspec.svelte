<script lang="ts">
    import { showConfirm } from '$src/lib/alert/store'
    import Layout from '$src/layout/pages/Layout.svelte'
    import { Switch, ButtonBadge, SeparateWindow } from '$src/components'
    import GetLabviewSettings from '$lib/GetLabviewSettings.svelte'
    import Configs, { configs } from '$src/Pages/masspec/configs/Configs.svelte'
    import { plot } from '$src/js/functions'
    import { readMassFile } from './masspec/mass'
    import computePy_func from '$lib/pyserver/computePy'
    import Database from './masspec/components/Database.svelte'
    export let id = 'Masspec'
    export let display = 'grid'
    export let saveLocationToDB = true

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
            plot('Mass spectrum', 'Mass [u]', 'Counts', dataFromPython, plotID, logScale, true)
            // graphPlotted = true
            return
        }
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
    let DB_active = false
</script>

<Database bind:DB_active filenames={fullfileslist} file_location={currentLocation} />

<Layout {display} {filetype} {id} bind:currentLocation bind:fileChecked bind:fullfileslist>
    <svelte:fragment slot="buttonContainer">
        <div class="align " style="align-items: center;">
            <button class="button is-link" id={btnID} on:click={(e) => plotData({ e: e })}> Masspec Plot</button>
            <GetLabviewSettings {currentLocation} {fullfileslist} {fileChecked} />
            <ButtonBadge on:click={(e) => plotData({ e, filetype: 'general' })} label="Open in Matplotlib" />
            <Switch style="margin: 0 1em;" on:change={linearlogCheck} bind:selected={logScale} label="Log" />
            <button class="button is-warning ml-auto" on:click={() => (DB_active = true)}>Database</button>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="plotContainer">
        <div id={plotID} class="graph__div" />
    </svelte:fragment>

    <svelte:fragment slot="config">
        <div class="align">
            <Configs />
        </div>
    </svelte:fragment>
</Layout>
