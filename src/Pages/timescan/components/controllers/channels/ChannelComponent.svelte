<script lang="ts">
    import { Textfield, Select } from '$src/components'
    export let item: Timescan.LossChannel
    export let rateConstantMode = false
    export let ions_lists: string[] = []
    export let ind: number = 0

    const dispatch = createEventDispatcher()
    // onMount(() => {
    //     if (!('sliderController' in item)) item.sliderController = '0, 0.5, 1e-3'
    // })
</script>

<div class="channel_div">
    <!-- <button class="i-mdi-menu" style="cursor: move;" /> -->
    <span class="channel_counter">{ind + 1}</span>
    <Select bind:value={item.type} label="type" options={['forwards', 'backwards']} />
    <Textfield bind:value={item.name} label="name" />
    <Select bind:value={item.lossFrom} label="lossFrom" options={['<resp. ion>', ...ions_lists]} />
    <Select
        bind:value={item.attachTo}
        label="attachTo"
        options={['none', 'all', ...ions_lists.filter((n) => n !== item.lossFrom)]}
    />
    {#if item.sliderController}
        <Textfield bind:value={item.sliderController} label="(min, max, step)" style="width: 10em;" />
    {/if}
    {#if item?.numberDensity && rateConstantMode}
        <Textfield bind:value={item.numberDensity} label="ND^n" style="width: 7em;" />
    {/if}
    <button
        class="button is-danger"
        on:click={() => {
            dispatch('remove', { id: item.id })
        }}>X</button
    >
</div>

<style>
    .channel_div {
        display: flex;
        justify-content: space-evenly;
        align-items: flex-end;
        gap: 1em;
    }

    .channel_counter {
        border: solid 1px;
        padding: 0.3em;
        border-radius: 1em;
        width: 2em;
        height: 2em;
        display: flex;
        justify-content: center;
    }
</style>
