<script lang="ts">
    import { entry_values, masscan_range } from './stores'
    import { Select, Textfield } from '$src/components'
    import { readMassFile } from '$src/Pages/masspec/mass'

    export let active = false
    export let file_location: string = ''
    export let filenames: string[] = []

    // let [range_from, range_to] = ['', '']

    const read_file = async (filename: string) => {
        if (!filename) return
        const file = await path.join(file_location, filename)
        const contents = await readMassFile([file])
        const { x } = contents[filename]
        $masscan_range = [x[0], x.at(-1)]
    }

    $: read_file($entry_values.filename)
</script>

<div class:hide={!active} class="main__div p-2" style="overflow: auto;">
    <h3 style="width: 100%;">Required entires</h3>

    <Select label="filename" options={filenames} bind:value={$entry_values.filename} />
    <Textfield variant="outlined" label="Enter temperature (K)" bind:value={$entry_values.temperature} />

    <Textfield variant="outlined" label="Enter precursor name" bind:value={$entry_values.precursor} />
    <Textfield variant="outlined" label="Enter pressure (mBar)" bind:value={$entry_values.pressure} />
    <Textfield variant="outlined" label="Enter IE (eV)" bind:value={$entry_values.IE} />

    <Select label="Select ion-source type" bind:value={$entry_values.source} options={['storage', 'non-storage']} />

    <div class="tag is-warning ml-auto">
        Range: {$masscan_range[0]} - {$masscan_range[1]} m/z
    </div>

    <hr />

    <h3 style="width: 100%;">Optional entires</h3>

    <Textfield
        variant="outlined"
        style="width: 100%"
        label="Enter keywords (for instance experiment's target molecule, FELIX shift, etc.)"
        bind:value={$entry_values.keywords}
    />
    <Textfield
        variant="outlined"
        style="width: 100%"
        label="Enter notes (for instance who performed the experiments or testing after changes in a instrument, etc. )"
        bind:value={$entry_values.notes}
    />

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
