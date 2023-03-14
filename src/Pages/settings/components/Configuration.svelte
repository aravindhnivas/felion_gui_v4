<script lang="ts">
    import {
        felionpy,
        pyVersion,
        currentTab,
        pythonpath,
        serverDebug,
        pythonscript,
        pyServerPORT,
        developerMode,
        pyServerReady,
        felionlibVersion,
        serverCurrentStatus,
    } from '$lib/pyserver/stores'
    import { LOGGER, serverInfo } from '../utils/stores'
    import { BrowseTextfield, Switch, Textfield, OutputBox } from '$src/components'
    import { getPyVersion } from '../utils/checkPython'
    import { checkNetstat, killPID } from '../utils/network'
    import Badge from '@smui-extra/badge'
    import {
        stopServer,
        currentPortPID,
        fetchServerROOT,
        checkServerProblem,
        start_and_check_felionpy_with_toast,
    } from '$src/lib/pyserver/felionpyServer'
    import { invoke } from '@tauri-apps/api/tauri'
    import { check_felionpy_assets_status } from '../utils/assets-status'
    import { install_felionpy_from_zipfile } from '../utils/download-assets'

    onMount(async () => {
        try {
            LOGGER.info('Configuration mounted')
            if (import.meta.env.PROD && $currentPortPID.length > 0) await killPID()
        } catch (error) {
            if (error instanceof Error) console.error(error)
        } finally {
            serverInfo.add({ value: `pyVersion: ${$pyVersion}`, type: 'info' })
        }
    })
</script>

<div class="align animate__animated animate__fadeIn" class:hide={$currentTab !== 'Configuration'}>
    <h1>Configuration</h1>
    <div class="align">
        <div class="tag is-warning">
            {$pyVersion ? `Python ${$pyVersion} (felionlib ${$felionlibVersion})` : 'Python undefined'}
        </div>
        <div class="tag is-{$serverCurrentStatus.type}">
            {$serverCurrentStatus.value}
        </div>

        {#if $developerMode}
            <div class="tag is-danger ml-auto">Dev Mode</div>
        {/if}

        <div class="align">
            <button class="button is-link" on:click={() => ($developerMode = !$developerMode)}>
                Developer mode: {$developerMode}
            </button>
            <button
                class="button is-link"
                on:click={async (e) => {
                    await oO(getPyVersion(e))
                }}>getPyVersion</button
            >
        </div>

        {#if $developerMode}
            <div class="align">
                <BrowseTextfield
                    class="three_col_browse"
                    label="python-src"
                    bind:value={$pythonpath}
                    style="width: 100%;"
                    dir={false}
                    lock={!$developerMode}
                />
                <BrowseTextfield
                    class="three_col_browse"
                    label="python-script-src"
                    bind:value={$pythonscript}
                    style="width: 100%;"
                    lock={!$developerMode}
                />
            </div>
        {/if}

        {#if import.meta.env.DEV}
            <BrowseTextfield class="three_col_browse" label="felionpy" bind:value={$felionpy} dir={false} lock={true} />
        {/if}

        <button
            class="button is-warning mt-5"
            on:click={async () => {
                await check_felionpy_assets_status({ installation_request: true })
            }}>check-felionpy-assets</button
        >

        <button
            class="button is-link mt-5"
            on:click={async () => {
                const localdir = await path.appLocalDataDir()
                await shell.open(localdir)
            }}>APP Local data <i class="i-mdi-open-in-new" /></button
        >

        <button
            class="button is-link ml-auto"
            on:click={async ({ currentTarget }) => {
                toggle_loading(currentTarget)
                await oO(install_felionpy_from_zipfile())
                toggle_loading(currentTarget)
            }}>Install from ZIPfile <i class="i-material-symbols-drive-folder-upload-outline-sharp ml-1" /></button
        >

        <div id="serverControllers" class="align server-control">
            <div class="align">
                <button
                    class="i-mdi-refresh"
                    style="align-self: self-end;"
                    on:click={async () => {
                        if ($pyServerReady) return window.createToast('server already running')
                        $pyServerPORT = await invoke('get_tcp_port')
                    }}
                />

                <BrowseTextfield
                    type="number"
                    bind:value={$pyServerPORT}
                    label="serverPORT"
                    browseBtn={false}
                    lock={true}
                    style="display: flex;"
                />

                {#if $developerMode}
                    <Switch bind:selected={$serverDebug} label="debug mode" />
                {/if}
                <button
                    class="button is-link"
                    id="startServerButton"
                    on:click={start_and_check_felionpy_with_toast}
                    disabled={$pyServerReady && $serverCurrentStatus.value.includes('running')}
                >
                    STARTserver
                    {#if !$pyServerReady}
                        <Badge class="has-background-danger" />
                    {/if}
                </button>

                {#if $pyServerReady && $serverCurrentStatus.value.includes('running')}
                    <button class="button is-danger" id="stopServerButton" on:click={stopServer}> STOPserver </button>
                {/if}
                <button
                    class="button is-warning ml-auto"
                    id="fixServerButton"
                    on:click={async () => {
                        await checkServerProblem()
                    }}
                >
                    Check server PROBLEM
                </button>
            </div>
            <div class="align">
                <button
                    id="fetchServerROOT"
                    class="button is-link"
                    on:click={async ({ currentTarget }) => {
                        toggle_loading(currentTarget)
                        await fetchServerROOT()
                        toggle_loading(currentTarget)
                    }}>fetchServerROOT</button
                >
                <button
                    class="button is-link"
                    on:click={async ({ currentTarget }) => {
                        toggle_loading(currentTarget)
                        await checkNetstat()
                        toggle_loading(currentTarget)
                    }}>checkNetstat</button
                >
                <Textfield
                    value={$currentPortPID.join(', ')}
                    label="currentPortPID"
                    on:keyup={(e) => {
                        if (e.key === 'Enter') {
                            $currentPortPID = e.target.value.split(', ')
                        }
                    }}
                />

                <button class="button is-danger" on:click={async () => await killPID()}>killPID</button>
            </div>
        </div>

        <OutputBox bind:output={$serverInfo} heading="Server outputs" />
    </div>
</div>
