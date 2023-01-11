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
    import { BrowseTextfield, Switch, Textfield, OutputBox } from '$src/components'
    import { getPyVersion } from '../utils/checkPython'
    import { fetchServerROOT } from '../utils/serverConnections'
    import { checkNetstat, killPID } from '../utils/network'
    import { python_asset_ready } from '../utils/stores'
    import Badge from '@smui-extra/badge'
    import { startServer, stopServer, currentPortPID } from '$src/lib/pyserver/felionpyServer'
    import { invoke } from '@tauri-apps/api/tauri'
    import { platform } from '@tauri-apps/api/os'
    import { check_felionpy_assets_status } from '../utils/assets-status'

    let showServerControls: boolean
    let serverInfo: OutputBoxtype[] = []
    let serverCurrentStatus: OutputBoxtype = { value: '', type: 'info' }

    const updateServerInfo = async (e?: ButtonClickEvent) => {
        serverCurrentStatus = { value: 'server starting...', type: 'info' }
        serverInfo = [serverCurrentStatus, ...serverInfo]

        const target = e?.target as HTMLButtonElement
        const rootpage = await fetchServerROOT({ target })

        if (rootpage instanceof Error) {
            serverInfo = [{ value: rootpage.message, type: 'danger' }, ...serverInfo]
            serverCurrentStatus = { value: 'server closed', type: 'danger' }
            dispatch('serverStatusChanged', { closed: true })
        } else {
            $pyServerReady = true
            serverInfo = [{ value: rootpage, type: 'success' }, ...serverInfo]
            serverCurrentStatus = { value: `server running: port(${$pyServerPORT})`, type: 'success' }
            dispatch('serverStatusChanged', { closed: false })
        }
    }

    let currentplatform: string
    const dispatch = createEventDispatcher()

    const clearPORTs = async () => {
        const output = await killPID(currentplatform)
        if (!output) return
        serverInfo = [...output, ...serverInfo]
    }
    onMount(async () => {
        try {
            currentplatform = await platform()

            if (import.meta.env.DEV) return

            if ($currentPortPID.length > 0) {
                await clearPORTs()
            }
            await check_felionpy_assets_status()
            if (!$python_asset_ready) return

            await startServer()
            await updateServerInfo()
            await getPyVersion()
        } catch (error) {
            if (error instanceof Error) console.error(error)
        } finally {
            serverInfo = [{ value: `pyVersion: ${$pyVersion}`, type: 'info' }, ...serverInfo]
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
            <!-- {#if import.meta.env.DEV} -->
            <button class="button is-link" on:click={() => ($developerMode = !$developerMode)}>
                Developer mode: {$developerMode}
            </button>
            <!-- {/if} -->
            <button class="button is-link" on:click={getPyVersion}>getPyVersion</button>
        </div>

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

                <Switch bind:selected={$serverDebug} label="debug mode" />
                <button
                    class="button is-link"
                    class:is-loading={serverCurrentStatus.value.includes('starting')}
                    on:click={async () => {
                        await startServer()
                        serverInfo = [{ value: `PID: ${JSON.stringify($currentPortPID)}`, type: 'info' }, ...serverInfo]
                        await updateServerInfo()
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
                <button id="fetchServerROOT" class="button is-link" on:click={updateServerInfo}>fetchServerROOT</button>
                <button
                    class="button is-link"
                    on:click={async () => {
                        const output = await checkNetstat($pyServerPORT, currentplatform)
                        if (!output) return
                        serverInfo = [...output, ...serverInfo]
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
                <button class="button is-danger" on:click={async () => await clearPORTs()}>killPID</button>
            </div>
        </div>
        <OutputBox bind:output={serverInfo} heading="Server outputs" />
    </div>
</div>
