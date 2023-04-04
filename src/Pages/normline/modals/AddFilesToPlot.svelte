<script lang="ts">
    import { Textfield, Modal } from '$src/components'
    import { opoMode } from '../functions/svelteWritables'
    import computePy_func from '$lib/pyserver/computePy'
    import { uniq } from 'lodash-es'

    export let active = false
    export let addedFile: { files: string[]; col: string; scale: number; N: number } = {
        files: [],
        col: '0, 1',
        scale: 1,
        N: 0,
    }

    const uniqueID = getContext<string>('uniqueID')

    async function addFileSelection() {
        const result = (await dialog.open({ directory: false, multiple: true })) as string[]
        if (!result) return
        addedFile.files = uniq([...addedFile.files, ...result])
        window.createToast('Files added')
    }

    $: currentGraph = document.getElementById($opoMode[uniqueID] ? `${uniqueID}-opoRelPlot` : `${uniqueID}-avgplot`)
    async function plotData({ e = null } = {}) {
        const pyfile = 'normline.addTrace'
        if (addedFile.files.length < 1) return window.createToast('No files selected', 'danger')
        const plotted_names = currentGraph?.data.map((d) => d.name) ?? []

        let files = []
        for (const f of addedFile.files) {
            const filename = await path.basename(f)
            if (!plotted_names.includes(filename)) {
                files = [...files, f]
            }
        }
        if (files.length < 1) return (active = false)
        addedFile.N = plotted_names.length + addedFile.files.length

        console.log({ N: addedFile.N, files })
        computePy_func({ e, pyfile, args: { ...addedFile, files } }).then((dataFromPython) => {
            addTraces(currentGraph, dataFromPython)
            window.createToast('Graph Plotted', 'success')
            active = false
        })
    }
</script>

{#if active}
    <Modal bind:active title="Add file to plot">
        <svelte:fragment slot="content">
            <div class="tag is-warning" style="width: auto;">
                Make sure the filename does not ends with or have 'felix' extension
            </div>
            <div class="align mb-2">
                <button on:click={addFileSelection} class="button is-link">Browse</button>
                <Textfield bind:value={addedFile.col} label="Columns" />
                <Textfield bind:value={addedFile.scale} label="ScaleY" input$type="number" />
            </div>

            {#if addedFile.files.length > 0}
                <div class="align">
                    <div class="tag is-warning">{addedFile.files.length} file(s) added</div>
                    <div class="align">
                        {#each addedFile.files as file, i}
                            <div>{i + 1}: {file}</div>
                        {/each}
                    </div>
                </div>
            {/if}
        </svelte:fragment>
        <svelte:fragment slot="footerbtn">
            <button
                class="button is-danger"
                on:click={(e) => {
                    addedFile.files.forEach(async (f) => {
                        addedFile.files = addedFile.files.filter((file) => file !== f)
                        const plotted_names = currentGraph?.data.map((d) => d.name) ?? []
                        const filename = await path.basename(f)

                        const index = plotted_names.indexOf(filename)
                        if (index > -1) deleteTraces(currentGraph, [-1])
                    })
                }}>Clear</button
            >
            <button class="button is-link" on:click={(e) => plotData({ e: e })}>Add to plot</button>
        </svelte:fragment>
    </Modal>
{/if}
