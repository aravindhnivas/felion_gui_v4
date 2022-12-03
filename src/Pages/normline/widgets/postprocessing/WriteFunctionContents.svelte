<script lang="ts">
    import { felixOutputName, felixopoLocation } from '../../functions/svelteWritables'
    import Select from '$components/Select.svelte'
    import Switch from '$components/Switch.svelte'
    import { createEventDispatcher } from 'svelte'
    import TextAndSelectOptsToggler from '$components/TextAndSelectOptsToggler.svelte'
    import { path } from '@tauri-apps/api'

    export let writeFile: boolean = false
    export let writeFileName = 'average_normline.dat'
    export let output_namelists: string[] = []
    export let overwrite_expfit: boolean = true

    const dispatch = createEventDispatcher()
    const uniqueID = getContext<string>('uniqueID')
    let lookIn = ''
    onMount(async () => {
        lookIn = await path.resolve($felixopoLocation[uniqueID], '../EXPORT')
    })
</script>

<div class="align">
    <Select bind:value={$felixOutputName[uniqueID]} label="Output filename" options={output_namelists} />
    <TextAndSelectOptsToggler
        toggle={false}
        bind:value={writeFileName}
        label="writeFileName"
        {lookIn}
        lookFor=".dat"
        auto_init={true}
    />
    <Switch style="margin: 0 1em;" bind:selected={writeFile} label="Write" />
    <Switch style="margin: 0 1em;" bind:selected={overwrite_expfit} label="Overwrite" />
    <button class="button is-link" on:click={() => dispatch('addfile')}>Add files</button>
    <button class="button is-link" on:click={() => dispatch('removefile')}>Remove files</button>
</div>
