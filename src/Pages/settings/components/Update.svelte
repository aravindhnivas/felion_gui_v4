<script lang="ts">
    import {
        outputbox,
        downloadURL,
        downloadoverrideURL,
        python_asset_ready_to_install,
        LOGGER,
        // assets_installation_required,
        install_update_without_promt,
    } from '../utils/stores'
    import { currentTab } from '$lib/pyserver/stores'
    import { currentVersion } from '$src/js/functions'

    import Notify from '$lib/notifier/Notify.svelte'
    import { updateError } from '$src/sveltewritables'
    import { activateChangelog } from '$src/js/functions'
    import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
    import { relaunch } from '@tauri-apps/api/process'
    import { stopServer } from '$src/lib/pyserver/felionpyServer'
    import { confirm } from '@tauri-apps/api/dialog'
    import { listen } from '@tauri-apps/api/event'
    import LinearProgress from '@smui/linear-progress'
    import { Switch, OutputBox, Textfield } from '$src/components'
    import { footerMsg } from '$src/layout/main/footer_utils/stores'
    import { download_assets, check_assets_update, unZIP } from '../utils/download-assets'
    // import axios from 'axios'

    export const check_for_update = async (log = false) => {
        if (!window.navigator.onLine) return
        $install_update_without_promt = false
        await check_assets_update()

        outputbox.warn('checking for app update')
        if (assets_download_progress > 0 && assets_download_progress < 1) {
            return outputbox.warn('waiting for assets to complete downloading')
        }

        const response = await axios('https://api.github.com/repos/aravindhnivas/felion_gui_v4/releases/latest')
        const latest_version = response.data.tag_name
        outputbox.warn(`latest_version: ${latest_version}`)
        outputbox.warn(`current_version: v${$currentVersion}`)

        if (`v${$currentVersion}` === latest_version) {
            version_info = 'latest version installed'
            outputbox.success(version_info)
            return
        }

        try {
            if (log) outputbox.info('Checking for updates...')
            download_progress = 0
            lastUpdateCheck = new Date().toLocaleString()

            const update = await checkUpdate()
            if (log) outputbox.info(update)

            if (import.meta.env.DEV) return window.createToast('Update installation is skipped in dev mode', 'danger')

            if (import.meta.env.PROD && update.shouldUpdate) {
                const newVersion = update.manifest?.version

                let install_promted = $install_update_without_promt
                if (!install_promted) {
                    install_promted = await confirm(`Do you want to install the latest update and restart.`, {
                        title: `Update available ${newVersion}`,
                    })
                }

                if (install_promted) {
                    await stopServer()
                    outputbox.success(
                        `Installing update ${newVersion}, ${update.manifest?.date}, ${update.manifest.body}`
                    )

                    await installUpdate()
                    await relaunch()
                }
            }
        } catch (error) {
            $updateError = error
        }
    }

    let download_progress = 0
    let assets_download_progress = 0
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

    let updateReadyToInstall = false
    let lastUpdateCheck: string = 'Not checked yet'

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
    })

    onMount(async () => {
        LOGGER.info('Update mounted')
    })
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
                        if (!window.navigator.onLine) return outputbox.warn('No internet connection')
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
                    if (!window.navigator.onLine) return outputbox.warn('No internet connection')
                    toggle_loading(currentTarget)
                    const [_err] = await oO(check_assets_update({ download_request: true }))
                    toggle_loading(currentTarget)
                }}>Check assets update</button
            >
            <button
                id="btn-download-asset"
                class="button is-link"
                on:click={async ({ currentTarget }) => {
                    if (!window.navigator.onLine) return outputbox.warn('No internet connection')
                    assets_download_progress = 0
                    toggle_loading(currentTarget)
                    const [_err] = await oO(download_assets())
                    toggle_loading(currentTarget)
                }}>Download assets {$python_asset_ready_to_install ? 'again' : ''}</button
            >

            {#if $python_asset_ready_to_install}
                <button
                    id="install-asset-btn"
                    class="button is-warning"
                    on:click={async ({ currentTarget }) => {
                        toggle_loading(currentTarget)
                        const [_err] = await oO(unZIP(false))
                        toggle_loading(currentTarget)
                    }}>Install assets</button
                >
            {/if}
        </div>

        {#if assets_download_progress > 0 && assets_download_progress < 1}
            <div class="progress__div">
                <span class="tag is-warning">update-progress</span>
                <LinearProgress progress={assets_download_progress} />
            </div>
        {/if}

        <OutputBox bind:output={$outputbox} heading="update info" />
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
