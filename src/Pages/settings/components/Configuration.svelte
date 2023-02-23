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
    } from '$lib/pyserver/stores'
    import { LOGGER, serverInfo, python_asset_ready_to_install, python_asset_ready } from '../utils/stores'
    import { BrowseTextfield, Switch, Textfield, OutputBox } from '$src/components'
    import { getPyVersion } from '../utils/checkPython'
    import { checkNetstat, killPID } from '../utils/network'
    import Badge from '@smui-extra/badge'
    import { startServer, stopServer, currentPortPID } from '$src/lib/pyserver/felionpyServer'
    import { invoke } from '@tauri-apps/api/tauri'
    import { toggle_loading } from '../utils/misc'
    import axios from 'axios'
    // import { check_assets_update } from '../utils/download-assets'
    import { check_felionpy_assets_status } from '../utils/assets-status'
    import { asset_name_prefix, check_assets_update, unZIP } from '../utils/download-assets'

    // let showServerControls: boolean
    let serverCurrentStatus: OutputBoxtype = { value: '', type: 'info' }

    const dispatch_server_status = ({ closed }) => {
        if (closed) {
            serverCurrentStatus = { value: 'server closed', type: 'danger' }
            dispatch('serverStatusChanged', { closed: true })
            return
        }

        serverCurrentStatus = { value: `server running: port(${$pyServerPORT})`, type: 'success' }
        dispatch('serverStatusChanged', { closed: false })
    }

    const fetchServerROOT = async (delay = 0) => {
        if (delay > 0) await window.sleep(delay)

        const [_err, rootpage] = await oO(axios.get<{ string }>(`http://localhost:${$pyServerPORT}/`))
        if (_err) return serverInfo.error(`failed to fetch rootpage /`)

        $pyServerReady = true

        serverInfo.success(rootpage.data)
        dispatch_server_status({ closed: false })
    }

    const updateServerInfo = async (delay = 0) => {
        serverCurrentStatus = { value: 'checking server status...', type: 'info' }
        serverInfo.info(serverCurrentStatus.value)

        if (delay > 0) await window.sleep(delay)

        if (!$pyServerReady) return serverInfo.error('server not ready')
        const status = await checkNetstat()
        if (!status) {
            dispatch_server_status({ closed: true })
            return
        }
        await fetchServerROOT(delay)
    }

    const dispatch = createEventDispatcher()

    const start_and_check_felionpy = async () => {
        const out = await startServer()
        if (out) serverInfo.info(out)
        serverInfo.info(`PID: ${JSON.stringify($currentPortPID)}`)
        await updateServerInfo(1500)
        if ($pyServerReady) await getPyVersion()
    }

    $: if ($python_asset_ready && !$pyServerReady) {
        start_and_check_felionpy()
    }

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

    const install_felionpy_from_zipfile = async ({ currentTarget }) => {
        try {
            toggle_loading(currentTarget)
            const result = (await dialog.open({
                directory: false,
                filters: [
                    { name: 'zip files', extensions: ['zip'] },
                    { name: 'All files', extensions: ['*.*'] },
                ],
                multiple: false,
            })) as string

            if (!result) return

            serverInfo.warn(result)

            const asset_name = `${asset_name_prefix}-${await platform()}.zip`
            const localdir = await path.appLocalDataDir()
            const asset_zipfile = await path.join(localdir, asset_name)

            const [_err] = await oO(fs.copyFile(result, asset_zipfile))
            if (_err) {
                serverInfo.error(_err)
            } else {
                serverInfo.warn('file copied')
            }
            $python_asset_ready_to_install = true
            await oO(unZIP(false))
        } catch (error) {
            if (error instanceof Error) window.handleError(error)
        } finally {
            toggle_loading(currentTarget)
        }
    }
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

        {#if import.meta.env.DEV}
            <BrowseTextfield
                class="three_col_browse"
                label="felionpy"
                bind:value={$felionpy}
                dir={false}
                lock={$developerMode}
            />
        {/if}

        <button
            class="button is-warning mt-5"
            on:click={async () => {
                await check_felionpy_assets_status({ installation_request: true })
            }}>check-felionpy-asset</button
        >

        <button
            class="button is-link mt-5"
            on:click={async () => {
                const localdir = await path.appLocalDataDir()
                await shell.open(localdir)
            }}>APP Local data <i class="i-mdi-open-in-new text-2xl" /></button
        >

        <button class="button is-link ml-auto" on:click={install_felionpy_from_zipfile}
            >Install from ZIPfile <i
                class="i-material-symbols-drive-folder-upload-outline-sharp text-2xl ml-1"
            /></button
        >

        <div id="serverControllers" class="align server-control">
            <div class="align">
                <button
                    class="i-mdi-refresh text-2xl"
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
                    on:click={async ({ currentTarget }) => {
                        toggle_loading(currentTarget)
                        await start_and_check_felionpy()
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
                            await updateServerInfo(1500)
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
