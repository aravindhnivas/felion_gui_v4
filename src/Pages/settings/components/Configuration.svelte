<script lang="ts">
    import {
        pyVersion,
        felionlibVersion,
        pythonscript,
        pythonpath,
        pyServerPORT,
        developerMode,
        pyServerReady,
        currentTab,
        serverDebug,
        felionpy,
    } from '$lib/pyserver/stores'
    import { asset_download_required, python_asset_ready_to_install, serverInfo } from '../utils/stores'
    import { BrowseTextfield, Switch, Textfield, OutputBox } from '$src/components'
    import { getPyVersion } from '../utils/checkPython'
    import { checkNetstat, killPID } from '../utils/network'
    import { python_asset_ready } from '../utils/stores'
    import Badge from '@smui-extra/badge'
    import { startServer, stopServer, currentPortPID } from '$src/lib/pyserver/felionpyServer'
    import { invoke } from '@tauri-apps/api/tauri'
    import { auto_download_and_install_assets, check_felionpy_assets_status } from '../utils/assets-status'
    import { toggle_loading } from '../utils/misc'
    import axios from 'axios'
    import { check_assets_update } from '../utils/download-assets'

    let showServerControls: boolean
    let serverCurrentStatus: OutputBoxtype = { value: '', type: 'info' }

    const dispatch_server_status = ({ closed }) => {
        if (closed) {
            serverCurrentStatus = { value: 'server closed', type: 'danger' }
            dispatch('serverStatusChanged', { closed: true })
        } else {
            serverCurrentStatus = { value: `server running: port(${$pyServerPORT})`, type: 'success' }
            dispatch('serverStatusChanged', { closed: false })
        }
    }

    const fetchServerROOT = async () => {
        await window.sleep(1000)
        const [_err, rootpage] = await oO(axios.get<{ string }>(`http://localhost:${$pyServerPORT}/`))
        if (_err) return serverInfo.error(`failed to fetch rootpage /`)

        $pyServerReady = true
        serverInfo.success(rootpage.data)
        dispatch_server_status({ closed: false })
    }

    const updateServerInfo = async () => {
        serverCurrentStatus = { value: 'checking server status...', type: 'info' }
        serverInfo.info(serverCurrentStatus.value)
        await window.sleep(500)
        const status = await checkNetstat()

        if (!status) {
            dispatch_server_status({ closed: true })
            return
        }

        await fetchServerROOT()
    }

    const dispatch = createEventDispatcher()

    onMount(async () => {
        try {
            await check_felionpy_assets_status()

            if (import.meta.env.DEV) return

            if ($currentPortPID.length > 0) {
                await killPID()
            }

            if (!$python_asset_ready) return
            await startServer()
            await updateServerInfo()
            await getPyVersion()

            if($python_asset_ready_to_install) return
            await check_assets_update()
            if ($asset_download_required) {
                await auto_download_and_install_assets({ installation_request: true })
            }
        } catch (error) {
            if (error instanceof Error) console.error(error)
        } finally {
            serverInfo.add({ value: `pyVersion: ${$pyVersion}`, type: 'info' })
        }
    })
    // let joinedPorts = $currentPortPID.join(', ')
</script>

<div class="align animate__animated animate__fadeIn" class:hide={$currentTab !== 'Configuration'}>
    <h1>Configuration</h1>
    <div class="align">
        <div class="tag is-warning">
            {$pyVersion ? `Python ${$pyVersion} (felionlib ${$felionlibVersion})` : 'Python undefined'}
        </div>
        <div class="tag is-{serverCurrentStatus.type}">
            {serverCurrentStatus.value}
        </div>

        {#if $developerMode}
            <div class="tag is-danger ml-auto">Dev Mode</div>
        {/if}

        <div class="align">
            <button class="button is-link" on:click={() => ($developerMode = !$developerMode)}>
                Developer mode: {$developerMode}
            </button>
            <button class="button is-link" on:click={getPyVersion}>getPyVersion</button>
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

        <BrowseTextfield
            class="three_col_browse"
            label="felionpy"
            bind:value={$felionpy}
            dir={false}
            lock={$developerMode}
        />

        <button class="button is-link mt-6" on:click={() => (showServerControls = !showServerControls)}>
            Show server controls
            {#if !$pyServerReady}
                <Badge class="has-background-danger" />
            {/if}
        </button>
        <div id="serverControllers" class="align server-control">
            <div class="align">
                <span
                    role="presentation"
                    class="material-symbols-outlined"
                    on:click={async () => {
                        if ($pyServerReady) return window.createToast('server already running')
                        $pyServerPORT = await invoke('get_tcp_port')
                    }}>refresh</span
                >

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
                    on:click={async ({ currentTarget }) => {
                        toggle_loading(currentTarget)
                        await startServer()
                        serverInfo.add({ value: `PID: ${JSON.stringify($currentPortPID)}`, type: 'info' })
                        await updateServerInfo()
                        if ($pyServerReady) await getPyVersion()
                        toggle_loading(currentTarget)
                    }}
                    disabled={$pyServerReady && serverCurrentStatus.value.includes('running')}
                >
                    STARTserver
                    {#if !$pyServerReady}
                        <Badge class="has-background-danger" />
                    {/if}
                </button>
                {#if $pyServerReady && serverCurrentStatus.value.includes('running')}
                    <button
                        class="button is-danger"
                        id="stopServerButton"
                        on:click={async () => {
                            await stopServer()
                            await updateServerInfo()
                        }}
                    >
                        STOPserver
                    </button>
                {/if}
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
