<script lang="ts">
    import { currentTab, felionlibVersion } from '$lib/pyserver/stores'
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
    import { platform } from '@tauri-apps/api/os'

    import { http } from '@tauri-apps/api'
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
                    appupdate_downloading = true
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
        output = [val, ...output]
    }
    let showOutput = devMODE
    let assets_downloading = false
    let assets_download_needed = false
    let assets_version_available = ''

    async function downloadZIP(url, filename) {
        try {
            output = [{ value: 'downloading assets...', type: 'warning' }, ...output]
            const URL_to_download = downloadoverrideURL ? $downloadURL : url
            output = [{ value: URL_to_download, type: 'warning' }, ...output]
            const response = await http.fetch(URL_to_download, {
                method: 'GET',
                responseType: http.ResponseType.Binary,
            })
            // console.log(response)
            if (!response.ok) {
                output = [{ value: `Status ${response.status} : Invalid URL`, type: 'danger' }, ...output]
                return
            }
            output = [{ value: `assets downloaded`, type: 'success' }, ...output]
            await fs.writeBinaryFile(filename, response.data as Uint8Array, { dir: fs.BaseDirectory.AppLocalData })
            output = [{ value: `assets saved`, type: 'success' }, ...output]
            await unZIP(filename)
        } catch (error) {
            output = [{ value: `error occure while downloading assets`, type: 'danger' }, ...output]
            window.handleError(error)
        }
    }
    async function unZIP(filename) {
        const filepath = await path.appLocalDataDir()
        const cmd = new shell.Command(`unzip-${await platform()}`, [
            'Expand-Archive',
            '-Path',
            `${await path.join(filepath, filename)}`,
            '-DestinationPath',
            `${filepath}`,
        ])

        let err: string
        const child = await cmd.spawn()

        output = [{ value: `unzip PID: ${child.pid}`, type: 'info' }, ...output]
        cmd.on('close', () => {
            output = [{ value: 'UNZIP closed', type: 'info' }, ...output]
            output = [{ value: err ? 'failed to UNZIP' : 'UNZIP success', type: err ? 'danger' : 'success' }, ...output]
        })

        cmd.on('error', (error) => {
            err = error
            output = [{ value: 'Error whiile UNZIPing assets', type: 'danger' }, ...output]
            output = [{ value: JSON.stringify(error), type: 'danger' }, ...output]
        })

        cmd.stderr.on('data', (stderr) => {
            err = stderr
            output = [{ value: JSON.stringify(stderr), type: 'danger' }, ...output]
        })

        cmd.stdout.on('data', (stdout) => {
            output = [{ value: JSON.stringify(stdout), type: 'info' }, ...output]
        })
    }

    const check_assets_update = async () => {
        if (!$felionlibVersion) {
            output = [{ value: 'Current version not determined yet.', type: 'danger' }, ...output]
            return
        }
        output = [{ value: 'checking for assets update...', type: 'info' }, ...output]

        const [_err1, response] = await oO(
            http.fetch<{ version: string }>(
                'https://raw.githubusercontent.com/aravindhnivas/felionpy/main/version.json',
                {
                    method: 'GET',
                    responseType: http.ResponseType.JSON,
                }
            )
        )
        if (_err1) return window.handleError(_err1)
        if (!response.ok) return window.createToast('Could not download the assets', 'danger')

        const { version } = response.data
        output = [{ value: `Available version: ${version}`, type: 'info' }, ...output]
        output = [{ value: `Current version: ${$felionlibVersion}`, type: 'info' }, ...output]
        assets_version_available = `v${version}`
        assets_download_needed = $felionlibVersion < version
        if (assets_download_needed) {
            output = [{ value: `Download required`, type: 'warning' }, ...output]
        } else {
            output = [{ value: `Download not required`, type: 'warning' }, ...output]
        }
    }

    const downloadURL = persistentWritable(
        'download_URL_test',
        'https://github.com/aravindhnivas/felionpy/archive/refs/tags/v0.0.11.zip'
    )
    const download_assets = async () => {
        if (!assets_version_available) {
            output = [{ value: 'Check for assets update first.', type: 'warning' }, ...output]
            return
        }

        assets_downloading = true

        const asset_name = `felionpy-${await platform()}.zip`
        const base_url = 'https://github.com/aravindhnivas/felionpy/releases/download'
        const URL = `${base_url}/${assets_version_available}/${asset_name}`

        if (assets_download_needed) {
            await downloadZIP(URL, asset_name)
            return
        }
        if (!(await confirm('Download anyway', { title: 'Download not required' }))) return
        await downloadZIP(URL, asset_name)
    }
    let downloadoverrideURL = false
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
        {#if import.meta.env.DEV}
            <Textfield bind:value={$downloadURL} label="download-URL" style="width: 100%" />
            <Switch bind:selected={downloadoverrideURL} label="override URL" />
        {/if}
        <span class="tag is-warning">assets download</span>
        <button class="button is-link" on:click={check_assets_update}>Check assets update</button>
        <button class="button is-link" on:click={download_assets}>Download assets</button>
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
