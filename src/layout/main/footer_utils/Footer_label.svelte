<script lang="ts">
    import { pyServerReady } from '$lib/pyserver/stores'
    import {
        python_asset_ready,
        installing_python_assets,
        python_asset_ready_to_install,
    } from '$src/Pages/settings/utils/stores'
    import { start_and_check_felionpy_with_toast } from '$src/lib/pyserver/felionpyServer'
    import { check_felionpy_assets_status } from '$src/Pages/settings/utils/assets-status'
</script>

<div class="navbar-item py-0" style="gap: 0.5em;">
    <div aria-label="click to  start python server" data-cooltipz-dir="top">
        {#if !$pyServerReady}
            <button
                class="i-mdi-server-off bg-red text-xs"
                on:click={async () => {
                    await start_and_check_felionpy_with_toast()
                }}
            />
        {/if}
    </div>

    {#if !$python_asset_ready}
        <div aria-label="click to check python assets" data-cooltipz-dir="top">
            <button
                class="i-subway-missing bg-red text-xs"
                on:click={async () => {
                    await check_felionpy_assets_status()
                }}
            />
        </div>
    {/if}

    {#if $python_asset_ready_to_install && !$installing_python_assets}
        <div
            role="presentation"
            class="tag is-warning gap-2"
            style="cursor: pointer;"
            aria-label={'click to install'}
            data-cooltipz-dir={'top'}
            on:click={() => {
                const installBtn = document.getElementById('install-asset-btn')
                if (installBtn) installBtn.click()
            }}
        >
            <span style="color: black;">felionpy assets ready to install</span>
            <i class="i-ic-baseline-install-desktop" />
        </div>
    {/if}
</div>
