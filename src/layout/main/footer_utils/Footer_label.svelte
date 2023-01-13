<script lang="ts">
    import { pyServerReady } from '$lib/pyserver/stores'
    import { python_asset_ready, python_asset_ready_to_install } from '$src/Pages/settings/utils/stores'
    import { activePage } from '$src/sveltewritables'
</script>

{#if !($pyServerReady && $python_asset_ready)}
    <div class="navbar-item" style="gap: 0.5em;">
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

        {#if $python_asset_ready_to_install}
            <div
                role="presentation"
                class="tag is-warning"
                style="cursor: pointer;"
                aria-label={'click to install'}
                data-cooltipz-dir={'top'}
                on:click={() => {
                    const installBtn = document.getElementById('install-asset-btn')
                    if (installBtn) installBtn.click()
                }}
            >
                felionpy assets ready to install
            </div>
        {/if}
    </div>
{/if}
