<script lang="ts">
    import { DBlocation, status } from './stores'
    import { BrowseTextfield } from '$src/components'
    import { LOGGER } from '$src/Pages/settings/utils/stores'

    onMount(async () => {
        const sep = await path.sep
        if ($DBlocation) return
        $DBlocation = `${sep}${sep}felixstorage.science.ru.nl${sep}felixstorage${sep}groups${sep}fis${sep}FELion${sep}Students${sep}Aravindh${sep}MasspecDB`
        LOGGER.info({ $DBlocation })
    })
</script>

<div class="flex">
    <BrowseTextfield
        class="three_col_browse"
        label="Database location {$status !== 'connected' ? '(Mount drive to connect to database)' : ''}"
        bind:value={$DBlocation}
        on:change={status.connect}
        lock={$status === 'connected'}
    />
    <button class="button is-link" class:is-loading={$status === 'connecting'} on:click={status.connect}
        >{$status}</button
    >
    {#if $status === 'connected'}
        <i class="i-fluent-mdl2-plug-connected bg-green" />
    {:else}
        <i class="i-fluent-mdl2-plug-disconnected bg-red" />
    {/if}
</div>

{#if $status === 'connected'}
    <div class="flex" style="gap: 0.5em;">
        <span class="tag is-warning">TABLE: massfiles</span>
        <span class="tag is-warning">FILE: masspec.db</span>
    </div>
{/if}
