<script lang="ts">
    import { addTraces } from 'plotly.js-basic-dist'
    import Textfield from '@smui/textfield'
    import Modal from '$components/modal/Modal.svelte'
    import { opoMode } from '../functions/svelteWritables'
    import computePy_func from '$lib/pyserver/computePy'
    import { dialog } from '@tauri-apps/api'

    export let active = false
    export let fileChecked = []
    export let addedFileCol = '0, 1'
    export let addedFileScale = 1000

    export let addedfiles: string[] = []

    export let addedFile: { files: string[]; col: string; scale: number; N: number } = {
        files: [],
        col: '0, 1',
        scale: 1,
        N: 0,
    }
    export let extrafileAdded = 0

    const uniqueID = getContext<string>('uniqueID')

    async function addFileSelection() {
        const result = (await dialog.open({ directory: false, multiple: true })) as string[]
        if (!result) return
        addedfiles = addedFile['files'] = result
        window.createToast('Files added')
    }

    function plotData({ e = null } = {}) {
        const pyfile = 'normline.addTrace'
        let args
        if (addedFile.files.length < 1) return window.createToast('No files selected', 'danger')
        extrafileAdded += addedfiles.length
        addedFile['col'] = addedFileCol
        addedFile['N'] = fileChecked.length + extrafileAdded

        addedFile['scale'] = addedFileScale
        args = addedFile

        computePy_func({ e, pyfile, args }).then((dataFromPython) => {
            const currentGraph = $opoMode[uniqueID] ? `${uniqueID}-opoRelPlot` : `${uniqueID}-avgplot`
            addTraces(currentGraph, dataFromPython)
            window.createToast('Graph Plotted', 'success')
            active = false
        })
    }
</script>

{#if active}
    <Modal bind:active title="Add file to plot">
        <div class="align" slot="content">
            <Textfield bind:value={addedFileCol} label="Columns" />
            <Textfield bind:value={addedFileScale} label="ScaleY" />
            <button on:click={addFileSelection} class="button is-link">Browse</button>
        </div>
        <button slot="footerbtn" class="button is-link" on:click={(e) => plotData({ e: e })}>Add</button>
    </Modal>
{/if}
