<script lang="ts">
    import { opoMode, felixopoLocation } from '../../functions/svelteWritables'
    import { Table } from '$src/components'
    import { savefile, loadfile } from '../../functions/misc'
    import computePy_func from '$lib/pyserver/computePy'
    import { get_details_func } from '../../functions/get_details'

    export let felixfiles: string[]
    export let opofiles: string[]
    export let normMethod: string

    let toggleFileDetailsTable = false
    let filedetails = []
    const uniqueID = getContext<string>('uniqueID')
    async function plotData({ e = null } = {}) {
        if (felixfiles.length < 1) return window.createToast('No files selected', 'danger')

        const pyfile = 'normline.getfile_details'
        const files = $opoMode[uniqueID] ? opofiles : felixfiles
        const args = { files, normMethod }

        const dataFromPython = await computePy_func({ e, pyfile, args })
        if (!dataFromPython) return

        filedetails = get_details_func({ dataFromPython })
        toggleFileDetailsTable = true
    }

    async function loadfiledetails() {
        const loadedfile = await loadfile('filedetails', $felixopoLocation[uniqueID])
        if (loadedfile.length < 1) return
        toggleFileDetailsTable = true
        filedetails = loadedfile
    }
    onMount(() => {
        loadfiledetails()
    })
</script>

<div class="align">
    <button class="button is-link" on:click={(e) => plotData({ e: e })}>Get details</button>
    <button
        class="{toggleFileDetailsTable ? 'i-mdi-arrow-drop-up' : 'i-mdi-arrow-drop-down'} mr-2"
        on:click={() => (toggleFileDetailsTable = !toggleFileDetailsTable)}
    />
    <button
        class="button is-link"
        on:click={async () =>
            await savefile({ file: filedetails, name: 'filedetails', location: $felixopoLocation[uniqueID] })}
        >Save</button
    >
    <button class="button is-link" on:click={loadfiledetails}>Load</button>

    {#if toggleFileDetailsTable}
        <Table
            id="felix_filedetails_table"
            bind:rows={filedetails}
            closeOption={false}
            sortOption={true}
            animateRow={false}
            head={[
                'Filename',
                'min(cm-1)',
                'max(cm-1)',
                'Trap(s)',
                'B0(ms)',
                'Res.(V)',
                'IE(eV)',
                'Temp(K)',
                'Precursor',
            ]}
            keys={['filename', 'min', 'max', 'trap', 'b0', 'res', 'ie', 'temp', 'precursor']}
        />
    {/if}
</div>
