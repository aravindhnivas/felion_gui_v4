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
    import { footerMsg } from '$src/layout/main/footer_utils/stores'
    import { outputbox, downloadURL, downloadoverrideURL } from '../utils/stores'
    import { download_assets, check_assets_update } from '../utils/download-assets'
    import { toggle_loading } from '../utils/misc'

    const check_for_update = async (log = false) => {
        try {
            if (devMODE) {
                if (!$allow_to_check_update) {
                    return window.createToast('Update check skipped in dev mode', 'danger')
                }
            }

            if (log) outputbox.info('Checking for updates...')
            download_progress = 0
            lastUpdateCheck = new Date().toLocaleString()

            const update = await checkUpdate()
            if (log) outputbox.info(update)

            if (!devMODE && update.shouldUpdate) {
                const newVersion = update.manifest?.version
                const install = await confirm(`Do you want to install the latest update and restart.`, {
                    title: `Update available ${newVersion}`,
                })
                if (install) {
                    appupdate_downloading = true
                    await stopServer()
                    outputbox.success(
                        `Installing update ${newVersion}, ${update.manifest?.date}, ${update.manifest.body}`
                    )
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
    let assets_download_progress = 0
    let appupdate_downloading = false
    let version_info = ''

    const update_footer_download_label = (percent: number) => {
        if (Number(percent) < 100) {
            $footerMsg.status = 'running'
        } else if (Number(percent) === 0) {
            $footerMsg.status = 'idle'
        } else {
            $footerMsg.status = 'done'
        }
    }

    const listen_download_progress = listen('tauri://update-download-progress', async function (res) {
        if (res.payload) {
            const { chunkLength, contentLength } = res.payload as { chunkLength: string; contentLength: string }

            download_progress += +chunkLength / +contentLength
            const percent = Number(download_progress * 100).toFixed(2)
            $footerMsg.msg = `Downloading Update (${percent} %)`

            update_footer_download_label(Number(percent))
        }
    })

    let updateIntervalCycle: NodeJS.Timer | null = null
    let assetsUpdateIntervalCycle: NodeJS.Timer | null = null
    let updateReadyToInstall = false
    let lastUpdateCheck: string = 'Not checked yet'

    const devMODE = import.meta.env.DEV

    const unlisten_download_asset_event = listen<string>('assets-download-progress', (event) => {
        const percent = event.payload
        assets_download_progress = Number(percent) / 100
        $footerMsg.msg = `Downloading python assets (${percent} %)`
        update_footer_download_label(Number(percent))
    })

    onDestroy(async () => {
        const unlisten1 = await unlisten_download_asset_event
        unlisten1()

        const unlisten2 = await listen_download_progress
        unlisten2()

        if (updateIntervalCycle) {
            clearInterval(updateIntervalCycle)
        }

        if (assetsUpdateIntervalCycle) {
            clearInterval(assetsUpdateIntervalCycle)
        }
        console.warn('Update destroyed')
    })
    onMount(async () => {
        if (import.meta.env.DEV) return
        check_for_update()
        updateIntervalCycle = setInterval(check_for_update, $updateInterval * 60 * 1000)
        assetsUpdateIntervalCycle = setInterval(check_assets_update, $updateInterval * 60 * 1000)
    })

    const allow_to_check_update = persistentWritable('allow_to_check_update', false)
    let showOutput = true
</script>

<div class="align animate__animated animate__fadeIn" class:hide={$currentTab !== 'Update'}>
    <h1>Update</h1>
    <div class="align">
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
            <div class="progress__div">
                <span class="tag is-warning">update-progress</span>
                <LinearProgress progress={download_progress} />
            </div>
        {/if}

        <hr />

        <h3>Assets download</h3>

        {#if import.meta.env.DEV}
            <div class="align">
                <Textfield bind:value={$downloadURL} label="download-URL" style="width: 100%" />
                <Switch bind:selected={$downloadoverrideURL} label="override URL" />
            </div>
        {/if}

        <div class="align">
            <button
                id="btn-check-asset-update"
                class="button is-link"
                on:click={async ({ currentTarget }) => {
                    toggle_loading(currentTarget)
                    const [_err] = await oO(check_assets_update(true))
                    toggle_loading(currentTarget)
                }}>Check assets update</button
            >
            <button
                id="btn-download-asset"
                class="button is-link"
                on:click={async ({ currentTarget }) => {
                    assets_download_progress = 0
                    toggle_loading(currentTarget)
                    const [_err] = await oO(download_assets())
                    toggle_loading(currentTarget)
                }}>Download assets</button
            >
        </div>

        {#if assets_download_progress}
            <div class="progress__div">
                <span class="tag is-warning">update-progress</span>
                <LinearProgress progress={assets_download_progress} />
            </div>
        {/if}

        {#if showOutput}
            <OutputBox bind:output={$outputbox} heading="update info" />
        {/if}
    </div>
</div>

<style lang="scss">
    .progress__div {
        display: grid;
        grid-template-columns: auto 1fr;
        width: 100%;
        align-items: center;
        gap: 0.5em;
    }
    .updateCheck_status_div {
        display: flex;
        gap: 0.2em;
        align-items: flex-end;
        flex-direction: column;
        margin-left: auto;
    }
</style>
