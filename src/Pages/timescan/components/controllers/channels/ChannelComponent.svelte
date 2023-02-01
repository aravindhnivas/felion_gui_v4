<script lang="ts">
    import { Textfield, Select } from '$src/components'
    export let item: Timescan.LossChannel
    export let rateConstantMode = false
    export let ions_lists: string[] = []

    const dispatch = createEventDispatcher()
</script>

<div class="channel_div">
    <button class="i-mdi-menu text-2xl" />
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
        <Textfield bind:value={item.numberDensity} label="He^n" style="width: 7em;" />
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
    i {
        cursor: move;
    }
</style>
