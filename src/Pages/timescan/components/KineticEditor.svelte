<script lang="ts">
    import Editor from '$lib/Editor.svelte'
    import { computeKineticCodeScipy } from '../functions/computeKineticCode'
    export let location = ''
    export let savefilename = ''
    export let reportRead = false
    export let reportSaved = false
    export let nameOfReactants = ''
    export let loss_channels: Timescan.LossChannel[] = []
    export let selectedFile = ''
    export let rateConstantMode = false
    export let ND_name = 'He'

    let editor
    let computedCode: computeKineticCodeScipy

    $: maindata = {
        nameOfReactants,
        loss_channels,
        rateConstantMode,
        ND_name,
    }
    const computeSliders = () => {
        const computedCode_new = new computeKineticCodeScipy(maindata)
        const data = computedCode_new.sliders + computedCode?.model
        update_editor(data)
    }

    const update_editor = (data: string): void => {
        if (!data) return window.createToast('Could not generate the equation', 'danger')
        reportSaved = false
        const setData = `# Kinetics code: ${savefilename}\n${data}\n\n`
        editor?.setData(setData)
        window.createToast('data comupted')
    }
    const compute = () => {
        if (!nameOfReactants) {
            return window.createToast('No data available', 'danger')
        }

        const forwardChannels = loss_channels.filter(({ type }) => type === 'forwards')
        if (forwardChannels.length === 0) {
            return window.createToast('ERROR: Make atleast one rate equation', 'danger')
        }
        computedCode = new computeKineticCodeScipy(maindata)
        update_editor(computedCode.fullEquation)
    }

    let filenameOpts: string[] = []

    const filenameUpdate = async () => {
        const [_err, files] = await oO(fs.readDir(location))
        if (_err) {
            console.error(_err)
            return
        }
        filenameOpts = files
            .map((f) => f.name)
            .filter((f) => f.startsWith(selectedFile.split('.')[0]))
            .filter((f) => f.endsWith('.md'))
    }

    $: if (selectedFile) {
        filenameUpdate()
    }
</script>

<div class="report-editor-div" id="kinetics-editor__div">
    <Editor
        filetype="kinetics"
        showReport={true}
        mount="#kinetics-editor__div"
        id="kinetics-editor"
        mainTitle="Kinetic Code"
        {location}
        enable_location_browser={false}
        bind:savefilename
        bind:editor
        bind:reportRead
        bind:reportSaved
        {filenameOpts}
        {filenameUpdate}
    >
        <svelte:fragment slot="btn-row">
            <div class="align">
                <button class="button is-link" on:click={computeSliders}>update sliders</button>
                <button class="button is-link" on:click={compute}>compute full equations</button>
            </div>
        </svelte:fragment>
    </Editor>
</div>
