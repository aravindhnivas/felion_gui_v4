<script lang="ts">
    import { Modal } from '$src/components'
    import FelixPlotWidgets from './FelixPlotWidgets.svelte'
    export let active = false
    export let felixPlotCheckboxes = []
    export let theoryLocation: string
    export let felixPlotWidgets: {
        text: ValueLabel<string>[]
        boolean: ValueLabel<boolean>[]
        number: ValueLabel<string>[]
    }

    const dispatch = createEventDispatcher()
</script>

<Modal bind:active title="FELIX PLOTTING">
    <svelte:fragment slot="content">
        <FelixPlotWidgets bind:felixPlotWidgets bind:felixPlotCheckboxes {theoryLocation} />
    </svelte:fragment>
    <button
        slot="footerbtn"
        class="button is-link"
        on:click={(e) => {
            dispatch('submit', { event: e })
        }}
    >
        Submit
    </button>
</Modal>
