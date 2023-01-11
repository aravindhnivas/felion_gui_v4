<script context="module" lang="ts">
    export const footerMsg = writable<{ status: 'idle' | 'running' | 'done'; msg: string }>({ status: 'idle', msg: '' })
</script>

<script lang="ts">
    import { running_processes } from '$src/sveltewritables'
    import { pyServerReady } from '$lib/pyserver/stores'
    import { python_asset_ready } from '$src/Pages/settings/utils/stores'
    import { activePage } from '$src/sveltewritables'
    import { fade } from 'svelte/transition'
    import { STable } from '$src/components'
    import MenuSurface from '@smui/menu-surface'
    import type { MenuSurfaceComponentDev } from '@smui/menu-surface'

    let surface: MenuSurfaceComponentDev
</script>

<div class="animate__animated animate__fadeInUp" id="footer">
    <div class="navbar-menu">
        <div class="navbar-start">
            <div class="navbar-item">
                <p>Developed at Dr.Br&uuml;nken's group FELion@FELIX</p>
            </div>
        </div>

        <div class="navbar-end">
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

            {#if $footerMsg.status === 'running'}
                <div class="icon-footer">
                    <span>{$footerMsg.msg}</span>
                    <lord-icon trigger="loop" src="/assets/icons/lottie/loader.json" />
                </div>
            {/if}

            {#if $footerMsg.status === 'done'}
                <div class="icon-footer">
                    <span>Download completed</span>
                    <lord-icon trigger="hover" src="/assets/icons/lottie/confetti.json" />
                </div>
            {/if}

            {#if $running_processes.length > 0}
                <MenuSurface
                    style="background: var(--background-color);"
                    bind:this={surface}
                    anchorCorner="BOTTOM_START"
                    anchorMargin={{ top: 0, right: 50, bottom: 0, left: 0 }}
                >
                    <STable idKey="pid" rows={$running_processes} rowKeys={['pid', 'pyfile', 'close']} />
                </MenuSurface>
                <div
                    transition:fade
                    role="presentation"
                    class="navbar-item process__notify_container"
                    on:click={() => surface.setOpen(true)}
                >
                    Running {$running_processes.length}
                    {$running_processes.length > 1 ? 'processes' : 'process'}
                </div>
            {/if}
            <div class="navbar-item">
                <p>{import.meta.env.VITE_YEAR} &copy; {import.meta.env.VITE_AUTHOUR}</p>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .process__notify_container {
        cursor: pointer;
    }
    .navbar-end {
        display: flex;
        .icon-footer {
            display: flex;
            align-items: center;
            gap: 0.5em;
        }
        .navbar-item:not(:only-child) {
            border-left: solid 1px;
        }

        div {
            align-self: center;
            margin-right: 0.5em;
        }
    }
</style>
