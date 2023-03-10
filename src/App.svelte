<script lang="ts">
    // import { SvelteToast } from '@zerodevx/svelte-toast'
    import Navbar from '$src/layout/main//Navbar.svelte'
    import Footer from '$src/layout/main/Footer.svelte'
    import PreModal from '$src/lib/notifier/PreModal.svelte'
    import ConfirmAlert from '$src/lib/alert/ConfirmAlert.svelte'
    import Home from './Pages/Home.svelte'
    import Powerfile from './Pages/Powerfile.svelte'
    import Normline from './Pages/Normline.svelte'
    import Masspec from './Pages/Masspec.svelte'
    import Timescan from './Pages/Timescan.svelte'
    import THz from './Pages/THz.svelte'

    import Kinetics from './Pages/Kinetics.svelte'
    import Misc from './Pages/Misc.svelte'
    import Settings from './Pages/Settings.svelte'
    import PageLayout from '$src/layout/pages/PageLayout.svelte'
    import { events_listeners } from '$src/lib/event_listeneres'
    import { LOGGER } from '$src/Pages/settings/utils/stores'
    import { Toaster } from 'svelte-french-toast'

    const pageIDs = ['Normline', 'Masspec', 'Timescan', 'THz']
    const navItems = ['Home', ...pageIDs, 'Kinetics', 'Powerfile', 'Misc', 'Settings']
    const PageComponents = { Normline, Masspec, Timescan, THz }
    onMount(async () => {
        const unlisteners = await events_listeners()
        LOGGER.info('App mounted')
        window.createToast('App mounted', 'success')
        return () => {
            unlisteners.forEach((unlisten) => unlisten())
            LOGGER.clear()
        }
    })
</script>

<Toaster />
<PreModal />
<ConfirmAlert />

<div class="layout">
    <Navbar {navItems} />
    <div id="pageContainer" style="overflow: hidden;">
        <Home />
        {#each pageIDs as id}
            <PageLayout component={PageComponents[id]} {id} />
        {/each}
        <Kinetics />
        <Powerfile />
        <Misc />
        <Settings />
    </div>
    <Footer />
</div>

<style>
    .layout {
        display: grid;
        height: 100vh;
        grid-template-rows: auto 1fr auto;
    }
</style>
