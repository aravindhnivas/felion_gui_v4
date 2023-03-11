<script lang="ts">
    import { DBlocation, status } from './stores'
    import { BrowseTextfield } from '$src/components'
</script>

<BrowseTextfield class="three_col_browse" label="Database location" bind:value={$DBlocation} lock={true} />
<div class="flex ml-auto">
    <button class="button is-link" class:is-loading={$status === 'connecting'} on:click={status.submit}
        >{$status}</button
    >
    {#if $status === 'connected'}
        <i class="i-fluent-mdl2-plug-connected bg-green" />
    {:else}
        <i class="i-fluent-mdl2-plug-disconnected bg-red" />
    {/if}
</div>
