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
    import OutputBox from '$src/lib/OutputBox.svelte'
    import { listen } from '@tauri-apps/api/event'
    import LinearProgress from '@smui/linear-progress'
    import Switch from '$src/components/Switch.svelte'
    import { persistentWritable } from '$src/js/persistentStore'

    const check_for_update = async () => {
        try {
            if (devMODE) {
                if (!$allow_to_check_update) {
                    return window.createToast('Update check skipped in dev mode', 'danger')
                }
            }

            update_output('Checking for updates...')
            download_progress = 0
            lastUpdateCheck = new Date().toLocaleString()

            const update = await checkUpdate()
            update_output(update)

            if (update.shouldUpdate) {
                const newVersion = update.manifest?.version
                const install = await confirm(`Do you want to install the latest update and restart.`, {
                    title: `Update available ${newVersion}`,
                })
                if (install) {
                    await stopServer()
                    update_output(`Installing update ${newVersion}, ${update.manifest?.date}, ${update.manifest.body}`)
                    await installUpdate()
                    await relaunch()
                }
            }
        } catch (error) {
            if (typeof error === 'string' && error.includes('Json Error: EOF')) {
                version_info = 'latest version installed'
            } else {
                $updateError = error
            }
        }
    }

    let download_progress = 0
    let version_info = ''
    const listen_download_progress = listen('tauri://update-download-progress', function (res) {
        if (res.payload) {
            const { chunkLength, contentLength } = res.payload as { chunkLength: string; contentLength: string }
            download_progress += +chunkLength / +contentLength
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

    let outputs: string[] = []
    const allow_to_check_update = persistentWritable('allow_to_check_update', false)
    export const update_output = (val: string | Object) => {
        if (!val) return
        outputs = [JSON.stringify(val), ...outputs]
    }
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
                    await check_for_update()
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
        <div class="updateCheck_status_div">
            <span>Last checked</span>
            <span class="tag is-warning" id="update-check-status">{lastUpdateCheck}</span>
        </div>
        <Notify bind:label={$updateError} type="danger" />
    </div>

    {#if download_progress}
        <LinearProgress progress={download_progress} />
    {/if}

    <OutputBox
        items={outputs}
        on:clear={() => {
            outputs = []
        }}
    />
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
