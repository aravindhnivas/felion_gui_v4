<script lang="ts">
    import { currentTab } from '$lib/pyserver/stores'
    import { updateInterval, updateError } from '$src/sveltewritables'
    import { activateChangelog } from '$src/js/functions'
    import Notify from '$lib/notifier/Notify.svelte'
    import { getVersion } from '@tauri-apps/api/app'
    import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
    import { relaunch } from '@tauri-apps/api/process'

    const checkupdate = async () => {
        try {
            if (devMODE) return window.createToast('Update check skipped in dev mode', 'danger')

            console.warn('Checking for updates...')
            lastUpdateCheck = new Date().toLocaleString()
            const { shouldUpdate } = await checkUpdate()
            if (shouldUpdate) {
                await installUpdate()
                await relaunch()
            }
        } catch (error) {
            $updateError = error
        }
    }

    let updateIntervalCycle: NodeJS.Timer | null = null
    let updateReadyToInstall = false
    let lastUpdateCheck: string = 'Not checked yet'
    let currentVersion: string = ''

    const devMODE = import.meta.env.DEV
    onMount(async () => {
        currentVersion = await getVersion()

        if (devMODE) return
        checkupdate()
        updateIntervalCycle = setInterval(checkupdate, $updateInterval * 60 * 1000)

        return () => {
            console.warn('Update page unmounted')
            if (updateIntervalCycle) {
                clearInterval(updateIntervalCycle)
            }
        }
    })
</script>

<div class="align animate__animated animate__fadeIn" class:hide={$currentTab !== 'Update'}>
    <h1>Update</h1>
    <div class="subtitle" style="width: 100%;">
        Current version: {currentVersion}
    </div>

    <div class="align">
        <div class="align">
            <button
                class="button is-link"
                class:is-warning={updateReadyToInstall}
                id="updateCheckBtn"
                on:click={() => {
                    checkupdate()
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
            <div class="updateCheck_status_div">
                <span>Last checked</span>
                <span class="tag is-warning" id="update-check-status">{lastUpdateCheck}</span>
            </div>
            <div id="update-progress-container" style="display:none;">
                <label for="update-progress">Download progress:</label>
                <progress id="update-progress" max="100" value="0"> 0%</progress>
            </div>
            <Notify bind:label={$updateError} type="danger" />
        {/if}
    </div>
</div>

<style lang="scss">
    .updateCheck_status_div {
        display: flex;
        gap: 0.2em;
        align-items: flex-end;
        flex-direction: column;
        margin-left: auto;
    }
    #update-progress-container {
        progress {
            width: 100%;
        }
        display: grid;
        width: 100%;
        gap: 1em;
        grid-template-columns: auto 1fr;
        align-items: center;
    }
</style>
