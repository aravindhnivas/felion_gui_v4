<script lang="ts">
    import { fields } from './stores'
    import { Textfield, SegBtn, Radio } from '$src/components'
    // import HSplitPane from 'svelte-split-pane/src/HSplitPane.svelte'

    export let active = false

    let choices = [...fields.required, ...fields.optional].map((key) => {
        if (key.includes('precursor')) return { name: key, selected: true }
        return { name: key, selected: false }
    })
    // $: search_fields = choices.filter((choice) => choice.selected).map((choice) => ({ ...choice, value: '' }))
    $: console.log(search_fields)

    let search_fields = {}

    const update_search_field = (choices) => {
        for (const choice of choices) {
            if (choice.selected) {
                search_fields[choice.name] = ''
            }
        }
    }

    onMount(() => {
        update_search_field(choices)
    })

    let filename = '1'
</script>

<div class:hide={!active} class="main__div p-2" style="overflow: auto;">
    <h1 style="width: 100%">Search mode</h1>
    <span>Select fields to include in search</span>
    <SegBtn {choices} style="width: 100%;" on:selected={(e) => update_search_field(e.detail)} />

    <div class="align border-solid border-1 rounded-xl p-5">
        {#each Object.keys(search_fields) as label (label)}
            <Textfield {label} bind:value={search_fields[label]} />
        {/each}
    </div>

    <div class="align box my-5 border-solid border-1">
        <h3 style="width: 100%">Search results</h3>

        <div class="output__main__div">
            <div class="left">
                <Radio bind:value={filename} options={[1, 2, 3]} />
            </div>

            <div class="right">
                <h3>{filename}</h3>
            </div>
        </div>
    </div>
    <div class="graph_div" id="masspec-db-plot">Graph here</div>
</div>

<style lang="scss">
    .main__div {
        gap: 0.5em;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        .output__main__div {
            display: grid;
            grid-auto-flow: column;
            gap: 0.5em;
            grid-template-columns: auto 1fr;
            width: 100%;
            min-height: 300px;

            .left {
                display: flex;
                flex-direction: column;
                border-right: solid 1px white;
                padding-right: 2em;
            }
        }

        .graph_div {
            width: 100%;
            height: 100%;
            min-height: 500px;
            // background-color: beige;
            border: solid 1px black;
        }
    }
</style>
