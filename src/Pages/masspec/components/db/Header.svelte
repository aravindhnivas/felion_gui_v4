<script lang="ts">
    import { DBlocation, status } from './stores'
    import { BrowseTextfield } from '$src/components'

    onMount(async () => {
        const sep = await path.sep
        if ($DBlocation) return
        $DBlocation = `${sep}${sep}felixstorage.science.ru.nl${sep}felixstorage${sep}groups${sep}fis${sep}FELion${sep}Students${sep}Aravindh${sep}MasspecDB`
    })
</script>

<div class="flex">
    <BrowseTextfield class="three_col_browse" label="Database location" bind:value={$DBlocation} lock={true} />
    <button class="button is-link" class:is-loading={$status === 'connecting'} on:click={status.connect}
        >{$status}</button
    >
    {#if $status === 'connected'}
        <i class="i-fluent-mdl2-plug-connected bg-green" />
    {:else}
        <i class="i-fluent-mdl2-plug-disconnected bg-red" />
    {/if}
</div>
