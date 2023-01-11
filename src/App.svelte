<script lang="ts">
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
    // import Test from './Pages/Test.svelte'
    import PageLayout from '$src/layout/pages/PageLayout.svelte'
    import { events_listeners } from '$src/lib/event_listeneres'
    import { check_assets_update, download_assets } from './Pages/settings/utils/download-assets'
    import { downloadoverrideURL } from './Pages/settings/utils/stores'
    import { platform } from '@tauri-apps/api/os'

    const pageIDs = ['Normline', 'Masspec', 'Timescan', 'THz']
    const navItems = ['Home', ...pageIDs, 'Kinetics', 'Powerfile', 'Misc', 'Settings']
    const PageComponents = {
        Normline,
        Masspec,
        Timescan,
        THz,
    }

    // if (import.meta.env.MODE === 'development') {
    //     navItems.push('Test')
    // }

    const toastOpts = { reversed: true, intro: { y: 100 } }

    let mounted = false

    onMount(async () => {
        const unlisteners = await events_listeners()
        console.log('App mounted')

        console.warn('before update')
        if (!(await fs.exists('felionpy', { dir: fs.BaseDirectory.AppLocalData }))) {
            console.warn('felionpy asset REQUIRED!!')

            if (
                await dialog.confirm('Python assets are missing. Press OK to download.', {
                    type: 'warning',
                })
            ) {
                $downloadoverrideURL = false
                await check_assets_update(true)
                await download_assets()
            }
        }

        if (await fs.exists(`felionpy-${await platform()}.zip.DELETE`, { dir: fs.BaseDirectory.AppLocalData })) {
            console.warn('removing temp files from localdir')

            const [_err] = await oO(
                fs.removeFile(`felionpy-${await platform()}.zip.DELETE`, {
                    dir: fs.BaseDirectory.AppLocalData,
                })
            )

            if (_err) {
                console.warn('Could not remove temp files')
                console.error(_err)
            } else {
                console.warn('Temp files removed from localdir')
            }
        }
        mounted = true

        return () => {
            unlisteners.forEach((unlisten) => unlisten())
            console.log('App destroyed')
        }
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
        <!-- {#if mounted} -->
        {#each pageIDs as id}
            <PageLayout component={PageComponents[id]} {id} />
        {/each}
        <Kinetics />
        <Powerfile />
        <Misc />
        <Settings />

        <!-- {#if import.meta.env.MODE === 'development'}
                <Test />
                {/if} -->
        <!-- {/if} -->
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
