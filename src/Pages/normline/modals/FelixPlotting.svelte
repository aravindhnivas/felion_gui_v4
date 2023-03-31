<script lang="ts">
    import { Modal } from '$src/components'
    import FelixPlotWidgets from './FelixPlotWidgets.svelte'
    import { felixPlotCheckboxes } from '../functions/svelteWritables'

    export let active = false
    export let theoryLocation: string

    const dispatch = createEventDispatcher()
</script>

<Modal bind:active title="FELIX PLOTTING">
    <svelte:fragment slot="content">
        <FelixPlotWidgets {theoryLocation} />
    </svelte:fragment>
    <button
        slot="footerbtn"
        class="button is-link"
        on:click={async (e) => {
            if ($felixPlotCheckboxes[0].value.length === 0)
                return await dialog.message('Please select a DAT file', {
                    type: 'warning',
                    title: 'No file(s) selected',
                })
            dispatch('submit', { event: e })
        }}
    >
        Submit
    </button>
</Modal>
