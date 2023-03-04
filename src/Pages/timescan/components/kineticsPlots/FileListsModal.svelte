<script lang="ts">
    import { Modal, Textfield } from '$src/components'
    export let active: boolean = false
    export let fileCollections: { name: string; selected: boolean }[] = []
    let toggle_selections = false
    $: file_length = fileCollections.filter((f) => f.selected).length
    let search_name = ''
</script>

{#if active}
    <Modal bind:active title="File Lists: Left-click to toggle selection">
        <svelte:fragment slot="content">
            <!-- <SegBtn bind:choices={fileCollections} /> -->

            <div class="flex flex-wrap gap-2">
                <Textfield bind:value={search_name} label="search filenames" style="width:100%" />
                {#each fileCollections as { name, selected } (name)}
                    {@const hide = name.toLowerCase().indexOf(search_name.toLowerCase()) === -1}
                    <span class="tag is-warning" class:is-danger={!selected} class:hide>
                        {name}
                        <button class="delete is-small" on:click={() => (selected = !selected)} />
                    </span>
                {:else}
                    <span>No files</span>
                {/each}
            </div>
        </svelte:fragment>

        <svelte:fragment slot="footerbtn">
            <span class="tag is-warning" class:is-danger={file_length === 0}>
                {#if file_length === 0}
                    No files selected
                {:else}
                    {file_length} files selected
                {/if}
            </span>
            <button
                class="button is-link"
                on:click={() => {
                    fileCollections = fileCollections.map((filelist) => {
                        return {
                            name: filelist.name,
                            selected: toggle_selections,
                        }
                    })
                    toggle_selections = !toggle_selections
                }}>{toggle_selections ? 'select all' : 'clear all'}</button
            >
        </svelte:fragment>
    </Modal>
{/if}
