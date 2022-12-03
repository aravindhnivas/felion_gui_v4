<script lang="ts">
    import { felixopoLocation } from '../../functions/svelteWritables'
    import { theory_func } from '../../functions/theory'
    import TextSwitch from '$components/TextSwitch.svelte'
    import QuickBrowser from '$components/quickDrawers/QuickBrowser.svelte'
    import Switch from '$components/Switch.svelte'
    import computePy_func from '$lib/pyserver/computePy'
    import BrowseTextfield from '$src/components/BrowseTextfield.svelte'
    import { fs, path } from '@tauri-apps/api'

    let className = ''
    export { className as class }
    export let theoryRow = false

    export let normMethod: string
    export let theoryLocation: string

    let sigma = 7
    let scale = 1
    let tkplot = false
    let theoryfiles = []
    let showTheoryFiles = false
    let theoryfilesChecked = []

    const uniqueID = getContext<string>('uniqueID')

    const update_files = async (loc) => {
        if (!(await fs.exists(loc))) return
        theoryfiles = theoryfilesChecked.map(async (file) => await path.resolve(loc, file))
    }
    $: update_files(theoryLocation)

    async function plotData(e = null) {
        const pyfile = 'normline.theory'

        if (theoryfiles.length < 1) return window.createToast('No files selected', 'danger')

        const args = {
            theoryfiles,
            normMethod,
            sigma,
            scale,
            currentLocation: $felixopoLocation[uniqueID],
            tkplot,
            onlyExpRange,
        }

        const dataFromPython = await computePy_func({ e, pyfile, args })
        if (!dataFromPython) return
        theory_func({ dataFromPython, normMethod, uniqueID })
        showTheoryFiles = false
    }

    let onlyExpRange = false
</script>

<QuickBrowser
    title="Theory files"
    filetype="txt"
    bind:active={showTheoryFiles}
    bind:currentLocation={theoryLocation}
    bind:fileChecked={theoryfilesChecked}
    on:submit={(e) => {
        plotData(e.detail.event)
    }}
/>

{#if theoryRow}
    <div class="align box p-2 {className}" style="background-color: #77baf84d;">
        <BrowseTextfield class="two_col_browse p-1" bind:value={theoryLocation} label="Theory location" />

        {#await fs.exists(theoryLocation) then isExist}
            {#if isExist}
                <div class="align">
                    <button
                        class="button is-warning"
                        on:click={() => {
                            showTheoryFiles = !showTheoryFiles
                        }}>Show files</button
                    >
                    <TextSwitch style="width:7em;" variant="outlined" bind:value={sigma} label="Sigma" step="0.5" />
                    <TextSwitch
                        style="width:7em"
                        variant="outlined"
                        bind:value={scale}
                        label="Scale"
                        step="0.001"
                        max="1"
                    />
                    <Switch style="margin: 0 1em;" bind:selected={onlyExpRange} label="Only Exp. Range" />
                    <Switch style="margin: 0 1em;" bind:selected={tkplot} label="Matplotlib" />
                    <button class="button is-link" on:click={plotData}>Replot</button>
                </div>
            {/if}
        {/await}
    </div>
{/if}
