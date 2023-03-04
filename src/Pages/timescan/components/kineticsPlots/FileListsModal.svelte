<script lang="ts">
    import { SegBtn, Modal } from '$src/components'
    export let active: boolean = false
    export let fileCollections: { name: string; selected: boolean }[] = []
    let toggle_selections = false
</script>

{#if active}
    <Modal bind:active title="File Lists: Left-click to toggle selection">
        <svelte:fragment slot="content">
            <SegBtn bind:choices={fileCollections} />
        </svelte:fragment>

        <svelte:fragment slot="footerbtn">
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
