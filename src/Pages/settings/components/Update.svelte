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
    import { listen } from '@tauri-apps/api/event'
    import LinearProgress from '@smui/linear-progress'
    import { Switch, OutputBox, Textfield } from '$src/components'
    import { persistentWritable } from '$src/js/persistentStore'
    import { footerMsg } from '$src/layout/main/Footer.svelte'
    import { outputbox, downloadURL, downloadoverrideURL, override_felionpy_version_check } from '../utils/stores'
    import { download_assets, check_assets_update } from '../utils/download-assets'

    const check_for_update = async (log = false) => {
        try {
            if (devMODE) {
                if (!$allow_to_check_update) {
                    return window.createToast('Update check skipped in dev mode', 'danger')
                }
            }

            if (log) outputbox.add({ value: 'Checking for updates...', type: 'info' })
            download_progress = 0
            lastUpdateCheck = new Date().toLocaleString()

            const update = await checkUpdate()
            if (log) outputbox.add({ value: JSON.stringify(update, null, 2), type: 'info' })

            if (!devMODE && update.shouldUpdate) {
                const newVersion = update.manifest?.version
                const install = await confirm(`Do you want to install the latest update and restart.`, {
                    title: `Update available ${newVersion}`,
                })
                if (install) {
                    appupdate_downloading = true
                    await stopServer()
                    outputbox.add({
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
    let appupdate_downloading = false
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
        if (import.meta.env.DEV) return
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

    const allow_to_check_update = persistentWritable('allow_to_check_update', false)
    let showOutput = import.meta.env.DEV
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

    <hr />

    <div class="align">
        <span class="tag is-warning">assets download</span>
        <!-- {#if import.meta.env.DEV} -->
        <Textfield bind:value={$downloadURL} label="download-URL" style="width: 100%" />
        <Switch bind:selected={$downloadoverrideURL} label="override URL" />
        <Switch bind:selected={$override_felionpy_version_check} label="override_felionpy_version_check" />
        <!-- {/if} -->
        <button
            class="button is-link"
            on:click={async ({ currentTarget }) => {
                currentTarget.classList.toggle('is-loading')
                const [_err] = await oO(check_assets_update())
                currentTarget.classList.toggle('is-loading')
            }}>Check assets update</button
        >
        <button
            class="button is-link"
            on:click={async ({ currentTarget }) => {
                currentTarget.classList.toggle('is-loading')
                const [_err] = await oO(download_assets())
                currentTarget.classList.toggle('is-loading')
            }}>Download assets</button
        >
    </div>

    {#if download_progress}
        <LinearProgress progress={download_progress} />
    {/if}

    {#if showOutput}
        <OutputBox bind:output={$outputbox} heading="update info" />
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
