<script lang="ts">
    import { updateStatus, updateError } from '$src/sveltewritables'
    import { SvelteToast } from '@zerodevx/svelte-toast'
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
    import Test from './Pages/Test.svelte'
    import PageLayout from '$src/layout/pages/PageLayout.svelte'

    import { appWindow } from '@tauri-apps/api/window'
    import { confirm } from '@tauri-apps/api/dialog'
    import { stopServer } from '$lib/pyserver/felionpyServer'
    import { listen } from '@tauri-apps/api/event'

    const pageIDs = ['Normline', 'Masspec', 'Timescan', 'THz']
    const navItems = ['Home', ...pageIDs, 'Kinetics', 'Powerfile', 'Misc', 'Settings']
    const PageComponents = {
        Normline,
        Masspec,
        Timescan,
        THz,
    }

    if (import.meta.env.MODE === 'development') {
        navItems.push('Test')
    }

    const toastOpts = { reversed: true, intro: { y: 100 } }

    let unlistenList: Promise<import('@tauri-apps/api/event').UnlistenFn>[] = []
    unlistenList[0] = appWindow.onCloseRequested(async (event) => {
        const confirmed = await confirm('Are you sure?')
        if (!confirmed) {
            event.preventDefault()
        }
        await stopServer()
    })

    onMount(async () => {
        unlistenList[1] = listen('tauri://update-available', function (res) {
            console.log('New version available: ', res)
        })
        // res.payload.status    [ERROR/PENDING/DONE]
        unlistenList[2] = listen('tauri://update-status', function (res) {
            console.log('New status: ', res)
        })

        console.log('App mounted')
    })
    onDestroy(async () => {
        const unlistner = await Promise.all(unlistenList)
        unlistner.forEach((unlisten) => unlisten())
        console.log('App destroyed')
    })
</script>

<PreModal />
<div class="toast_container">
    <SvelteToast options={toastOpts} />
    <div id="leftToaster">
        <SvelteToast target="right" options={{ initial: 0, intro: { y: 100 } }} />
    </div>
    <div id="rightToaster">
        <SvelteToast target="left" options={{ intro: { y: 100 } }} />
    </div>
</div>
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

        {#if import.meta.env.MODE === 'development'}
            <Test />
        {/if}
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
