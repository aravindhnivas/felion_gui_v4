<script lang="ts">
    import { entry_values } from './stores'
    import { Select, Textfield } from '$src/components'
    export let active = false
    export let filenames: string[] = []
</script>

<div class:hide={!active} class="main__div p-2" style="overflow: auto;">
    <h3 style="width: 100%;">Required entires</h3>

    <Select label="filename" options={filenames} bind:value={$entry_values.filename} />
    <Textfield label="temperature (K)" bind:value={$entry_values.temperature} />

    <Textfield label="precursor name" bind:value={$entry_values.precursor} />
    <Textfield label="pressure (mBar)" bind:value={$entry_values.pressure} />
    <Textfield label="IE (eV)" bind:value={$entry_values.IE} />

    <Select label="Source type" bind:value={$entry_values.source} options={['storage', 'non-storage']} />

    <hr />

    <h3 style="width: 100%;">Optional entires (comma separated)</h3>

    <Textfield style="width: 100%" label="keywords" bind:value={$entry_values.keywords} />
    <Textfield style="width: 100%" label="notes" bind:value={$entry_values.notes} />

    <button class="button is-danger ml-auto mt-5" on:click={$entry_values.reset}>Reset</button>
</div>

<style lang="scss">
    .main__div {
        gap: 0.5em;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
</style>
