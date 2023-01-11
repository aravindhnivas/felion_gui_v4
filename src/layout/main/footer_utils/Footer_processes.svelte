<script lang="ts">
    import { running_processes } from '$src/sveltewritables'
    import { fade } from 'svelte/transition'
    import { STable } from '$src/components'
    import MenuSurface from '@smui/menu-surface'
    import type { MenuSurfaceComponentDev } from '@smui/menu-surface'

    let surface: MenuSurfaceComponentDev
</script>

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
        class="navbar-item"
        style="cursor: pointer;"
        on:click={() => surface.setOpen(true)}
    >
        Running {$running_processes.length}
        {$running_processes.length > 1 ? 'processes' : 'process'}
    </div>
{/if}
