<script lang="ts">
    import { showConfirm } from '$src/lib/alert/store'
    import { BrowseTextfield, Switch, TextAndSelectOptsToggler } from '$src/components'
    import WinBox from 'winbox/src/js/winbox.js'
    export let id = window.getID()
    export let location = ''

    export let filetype = ''
    export let editor = null
    export let mount: string
    export let mainTitle = 'Report/Editor'
    export let reportRead = false
    export let savefilename = 'report'
    export let reportSaved = false
    export let showReport = true
    export let enable_location_browser = true
    export let filenameOpts: string[] = []
    export let filenameUpdate = () => {}

    async function mountEditorFn(node) {
        try {
            editor = await ClassicEditor.create(node, {
                toolbar: { shouldNotGroupWhenFull: true },
            })
            readFromFile(false)
        } catch (error) {
            window.handleError(error)
        }
    }

    const mountEditor = (node: HTMLElement) => {
        mountEditorFn(node)
    }

    onDestroy(() => {
        if (!editor) return
        editor.destroy()
        console.info('editor destroyed')
    })

    $: if (!showReport && editor) {
        editor.destroy()
        console.info('editor destroyed')
    }

    if (localStorage.getItem(`${filetype}-report-md`)) {
        location = localStorage.getItem(`${filetype}-report-md`) as string
    }

    const update_report_filename = async (location, savefilename) => {
        reportFile = await path.join(
            location,
            savefilename ? (savefilename.endsWith('.md') ? savefilename : `${savefilename}.md`) : ''
        )
    }
    let reportFile = ''
    $: update_report_filename(location, savefilename)
    // $: if (fs.exist(location)) {
    //     window.db.set(`${filetype}-report-md`, location)
    // }

    const writeReport = async (info = 'saved') => {
        const contents = editor?.getData()

        const [_err] = await oO(fs.writeTextFile(reportFile, contents))
        if (_err) return window.handleError(_err)

        const type = info === 'saved' ? 'success' : 'warning'
        window.createToast(`${await path.basename(reportFile)}: report ${info}`, type)
        console.log('report writted: ', await path.basename(reportFile))
        reportSaved = true
    }

    const saveReport = async () => {
        if (!location) {
            return window.createToast('Invalid location', 'danger')
        }
        if (!(await fs.exists(reportFile))) {
            return writeReport('saved')
        } else if (overwrite) {
            return writeReport('overwritten')
        }

        return showConfirm.push({
            title: 'Overwrite?',
            content: `Do you want to overwrite ${await path.basename(reportFile)}?`,
            callback: (response) => {
                if (response?.toLowerCase() === 'cancel') return
                writeReport('overwritten')
            },
        })
    }

    let reportWindowClosed = true

    function openReport() {
        const graphWindow = new WinBox({
            root: document.getElementById('pageContainer'),
            mount: document.querySelector(mount),
            title: `Report ${filetype} `,
            x: 'center',
            y: 'center',
            width: '70%',
            height: '70%',
            background: '#634e96',
            top: 50,
            bottom: 50,
            onclose: function () {
                reportWindowClosed = true
            },
        })
        reportWindowClosed = false
        setTimeout(() => {
            graphWindow.focus()
        }, 100)
    }

    const readFromFile = async (showInfo = true) => {
        if (!(await fs.exists(reportFile))) {
            if (!showInfo) return
            return window.createToast('No report file named ' + (await path.basename(reportFile)), 'danger')
        }

        const [_err, fileRead] = await oO(fs.readTextFile(reportFile))
        if (_err) return window.handleError(_err)

        editor?.setData(fileRead)
        reportRead = true
        if (!showInfo) return

        window.createToast(`${await path.basename(reportFile)} file read`)
    }

    let autoRead = false
    let overwrite = false
    $: if (reportFile && autoRead) {
        readFromFile()
    }
</script>

<div class="report_main__div align">
    <div class="notice__div">
        {mainTitle}

        <div
            role="presentation"
            style="display: flex; font-size: large; font-weight: 400; padding-right: 1em;"
            on:click={() => (showReport = !showReport)}
        >
            {showReport ? 'hideReport' : 'showReport'}
        </div>
        {#if reportWindowClosed}
            <i role="presentation" class="material-symbols-outlined" on:click={openReport}>zoom_out_map</i>
        {/if}
    </div>

    {#if showReport}
        <div class="report_controler__div box" style="border: solid 1px #fff7;">
            <BrowseTextfield
                class="three_col_browse"
                bind:value={location}
                label="report location"
                lock={!enable_location_browser}
            >
                <TextAndSelectOptsToggler
                    bind:value={savefilename}
                    label="report name"
                    update={filenameUpdate}
                    options={filenameOpts}
                    auto_init={true}
                />
            </BrowseTextfield>

            <div class="btn-row">
                <slot name="btn-row" />
                <button class="button is-warning" on:click={() => readFromFile()}>read</button>
                <button class="button is-link" on:click={saveReport}>Save</button>
                <Switch bind:selected={autoRead} label="autoRead" />
                <Switch bind:selected={overwrite} label="overwrite" />
            </div>
        </div>
    {/if}
</div>

{#if showReport}
    <div use:mountEditor class="ckeditor-svelte content" {id} style:display={showReport ? '' : 'none'} />
{/if}
