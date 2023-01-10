<script lang="ts">
    import { currentTab } from '$lib/pyserver/stores'
    import { currentVersion } from '$src/js/functions'
    import Notify from '$lib/notifier/Notify.svelte'
    import { updateInterval, updateError } from '$src/sveltewritables'
    import { activateChangelog } from '$src/js/functions'
    import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
    import { relaunch } from '@tauri-apps/api/process'
    import { stopServer } from '$src/lib/pyserver/felionpyServer'
    import { confirm } from '@tauri-apps/api/dialog'
    // import OutputBox from '$src/lib/OutputBox.svelte'
    import { listen } from '@tauri-apps/api/event'
    import LinearProgress from '@smui/linear-progress'
    import { Switch, OutputBox } from '$src/components'
    import { persistentWritable } from '$src/js/persistentStore'
    import { footerMsg } from '$src/layout/main/Footer.svelte'

    const check_for_update = async (log = false) => {
        try {
            if (devMODE) {
                if (!$allow_to_check_update) {
                    return window.createToast('Update check skipped in dev mode', 'danger')
                }
            }

            if (log) update_output({ value: 'Checking for updates...', type: 'info' })
            download_progress = 0
            lastUpdateCheck = new Date().toLocaleString()

            const update = await checkUpdate()
            if (log) update_output({ value: JSON.stringify(update), type: 'info' })

            if (!devMODE && update.shouldUpdate) {
                const newVersion = update.manifest?.version
                const install = await confirm(`Do you want to install the latest update and restart.`, {
                    title: `Update available ${newVersion}`,
                })
                if (install) {
                    await stopServer()
                    update_output({
                        value: `Installing update ${newVersion}, ${update.manifest?.date}, ${update.manifest.body}`,
                        type: 'success',
                    })
                    await installUpdate()
                    await relaunch()
                }
            }
        } catch (error) {
            // since the update URL for latest version return undefined object
            // therefore, JSON.parse throws an error
            // following is the solution however it is not the best solution
            if (typeof error === 'string' && error.includes('Json Error: EOF')) {
                version_info = 'latest version installed'
            } else {
                $updateError = error
            }
        }
    }

    let download_progress = 0

    let version_info = ''

    const listen_download_progress = listen('tauri://update-download-progress', async function (res) {
        if (res.payload) {
            const { chunkLength, contentLength } = res.payload as { chunkLength: string; contentLength: string }

            download_progress += +chunkLength / +contentLength
            $footerMsg = `Update downloaded ${Number(download_progress * 100).toFixed(2)} %`
        }
    })

    let updateIntervalCycle: NodeJS.Timer | null = null
    let updateReadyToInstall = false
    let lastUpdateCheck: string = 'Not checked yet'

    const devMODE = import.meta.env.DEV

    onMount(async () => {
        if (devMODE) return
        check_for_update()
        updateIntervalCycle = setInterval(check_for_update, $updateInterval * 60 * 1000)
        return async () => {
            const unlisten = await listen_download_progress
            unlisten()
            console.warn('Update page unmounted')
            if (updateIntervalCycle) {
                clearInterval(updateIntervalCycle)
            }
        }
    })

    let output: OutputBoxtype[] = []

    const allow_to_check_update = persistentWritable('allow_to_check_update', false)
    export const update_output = (val: OutputBoxtype) => {
        // if (!val) return
        output = [val, ...output]
    }

    let showOutput = devMODE
</script>

<div class="align animate__animated animate__fadeIn" class:hide={$currentTab !== 'Update'}>
    <h1>Update</h1>
    <div class="subtitle" style="width: 100%;">
        Current version: {$currentVersion}
        <span class="tag is-success">{version_info}</span>
    </div>

    <div class="align">
        <div class="align">
            <button
                class="button is-link"
                class:is-warning={updateReadyToInstall}
                id="updateCheckBtn"
                on:click={async () => {
                    await check_for_update(true)
                }}
            >
                {updateReadyToInstall ? 'Quit and Install' : 'Check update'}
            </button>

            <button
                class="button is-warning"
                on:click={() => {
                    $activateChangelog = true
                }}>What's New</button
            >
        </div>
        {#if devMODE}
            <Switch bind:selected={$allow_to_check_update} label="allow to check update" />
        {/if}
        <Switch bind:selected={showOutput} label="show update logs" />

        <div class="updateCheck_status_div">
            <span>Last checked</span>
            <span class="tag is-warning" id="update-check-status">{lastUpdateCheck}</span>
        </div>
        <Notify bind:label={$updateError} type="danger" />
    </div>
    {#if download_progress}
        <LinearProgress progress={download_progress} />
    {/if}

    {#if showOutput}
        <OutputBox bind:output heading="update info" />
    {/if}
</div>

<style lang="scss">
    .updateCheck_status_div {
        display: flex;
        gap: 0.2em;
        align-items: flex-end;
        flex-direction: column;
        margin-left: auto;
    }
</style>
