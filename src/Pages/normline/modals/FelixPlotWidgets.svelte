<script lang="ts">
    import { felixopoLocation } from '../functions/svelteWritables'
    import { getfiles } from '../functions/stores/func'
    import { fade } from 'svelte/transition'
    import { Textfield, CheckList, Checkbox } from '$src/components'
    import { felixPlotCheckboxes, felixPlotWidgets } from '../functions/svelteWritables'

    export let theoryLocation: string

    const uniqueID = getContext<string>('uniqueID')

    async function loadFiles() {
        const felixOpoDatLocation = await path.resolve($felixopoLocation[uniqueID], '../EXPORT')
        const felixOpoDatfiles = await getfiles(felixOpoDatLocation, '.dat')

        const theoryfiles = await getfiles(theoryLocation, '.txt')
        $felixPlotCheckboxes = [
            {
                label: 'DAT_file',
                options: felixOpoDatfiles,
                value: [],
                id: window.getID(),
            },
            {
                label: 'Fundamentals',
                options: theoryfiles,
                value: [],
                id: window.getID(),
            },
            {
                label: 'Others',
                options: theoryfiles,
                value: [],
                id: window.getID(),
            },
            {
                label: 'Overtones',
                options: theoryfiles,
                value: [],
                id: window.getID(),
            },
            {
                label: 'Combinations',
                options: theoryfiles,
                value: [],
                id: window.getID(),
            },
        ]
        console.log(`files loaded`)
    }
</script>

<div style="padding-bottom: 1em;">
    <div class="align mb-2">
        <button class="button is-link ml-auto" on:click={async () => await loadFiles()}>fetch files</button>
    </div>
    <div class="align" style="justify-content: center; align-items: baseline;">
        {#each $felixPlotCheckboxes as { label, options, value, id } (id)}
            <div style="margin-bottom: 1em;" transition:fade>
                <div class="checkboxes_header">
                    {label}
                </div>
                <CheckList class="modal_checkboxes__div" bind:fileChecked={value} bind:items={options} />
            </div>
        {/each}
    </div>

    <div class="felix_plotting_div">
        <div class="widgets">
            {#each $felixPlotWidgets.text as { label, value, id } (id)}
                <Textfield type="text" bind:value {label} />
            {/each}
        </div>
        <div class="widgets">
            {#each $felixPlotWidgets.number as { label, value, id } (id)}
                <Textfield type="text" bind:value {label} />
            {/each}
        </div>
        <div class="widgets">
            {#each $felixPlotWidgets.boolean as { label, value, id } (id)}
                <Checkbox bind:value {label} />
            {/each}
        </div>
    </div>
</div>

<style>
    .checkboxes_header {
        border: solid 1px white;
        width: 10em;
        padding: 0.2em;
        display: flex;
        justify-content: center;
        border-radius: 20px;
        margin: auto;
    }
    .felix_plotting_div {
        border: solid 1px white;
        border-radius: 20px;
        display: flex;
        flex-wrap: wrap;
        flex-direction: column;
        align-items: center;
    }

    .widgets {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
        margin-bottom: 0.5em;
        justify-content: center;
    }
</style>
