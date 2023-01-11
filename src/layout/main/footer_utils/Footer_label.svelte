<script lang="ts">
    import { pyServerReady } from '$lib/pyserver/stores'
    import { python_asset_ready } from '$src/Pages/settings/utils/stores'
    import { activePage } from '$src/sveltewritables'
</script>

<div class="container mx-2">
    {#if !$pyServerReady}
        <div
            role="presentation"
            class="tag is-danger"
            style="cursor: pointer;"
            on:click={() => {
                $activePage = 'Settings'
            }}
        >
            python server not ready
        </div>
    {/if}

    {#if !$python_asset_ready}
        <div
            role="presentation"
            class="tag is-danger"
            style="cursor: pointer;"
            on:click={() => {
                $activePage = 'Settings'
            }}
        >
            python assets are missing
        </div>
    {/if}
</div>

<style>
    .container {
        display: flex;
        gap: 0.5em;
        align-items: center;
    }
</style>
