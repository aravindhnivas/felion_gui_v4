<script lang="ts">
    import {
        pyVersion,
        pythonscript,
        pyServerPORT,
        developerMode,
        pyServerReady,
        currentTab,
        serverDebug,
    } from '$lib/pyserver/stores'
    import { BrowseTextfield, Switch } from '$src/components'
    import { getPyVersion } from '../checkPython'
    import { fetchServerROOT } from '../serverConnections'
    import Badge from '@smui-extra/badge'
    import { startServer, stopServer } from '$src/lib/pyserver/felionpyServer'
    import { invoke } from '@tauri-apps/api/tauri'
    interface ServerInfo {
        value: string
        type: 'info' | 'danger' | 'warning' | 'success'
    }

    let showServerControls: boolean
    let serverInfo: ServerInfo[] = []
    let serverCurrentStatus: ServerInfo = { value: '', type: 'info' }

    const updateServerInfo = async (e?: ButtonClickEvent) => {
        serverCurrentStatus = { value: 'server starting...', type: 'info' }
        serverInfo = [...serverInfo, serverCurrentStatus]

        const target = e?.target as HTMLButtonElement
        const rootpage = await fetchServerROOT({ target })

        if (rootpage instanceof Error) {
            serverInfo = [...serverInfo, { value: rootpage.message, type: 'danger' }]
            serverCurrentStatus = { value: 'server closed', type: 'danger' }
            dispatch('serverStatusChanged', { closed: true })
        } else {
            $pyServerReady = true
            serverInfo = [...serverInfo, { value: rootpage, type: 'success' }]
            serverCurrentStatus = { value: `server running: port(${$pyServerPORT})`, type: 'success' }
            dispatch('serverStatusChanged', { closed: false })
        }
    }

    onMount(async () => {
        try {
            $pythonscript = await path.resolve('../src-python/')
            if (!$pyVersion) {
                console.warn('python is invalid. computing again')
                await getPyVersion()
                console.warn($pyVersion)
            }

            if (import.meta.env.PROD) {
                console.log('starting server')
                await startServer()
                await updateServerInfo()
            }
        } catch (error) {
            if (error instanceof Error) console.error(error)
        } finally {
            serverInfo = [...serverInfo, { value: `pyVersion: ${$pyVersion}`, type: 'info' }]
        }
    })
    const dispatch = createEventDispatcher()
</script>

<div class="align animate__animated animate__fadeIn" class:hide={$currentTab !== 'Configuration'}>
    <h1>Configuration</h1>
    <div class="align">
        <div class="tag is-warning">
            {$pyVersion || 'Python undefined'}
        </div>
        <div class="tag is-{serverCurrentStatus.type}">
            {serverCurrentStatus.value}
        </div>

        {#if $developerMode}
            <div class="tag is-danger ml-auto">Dev Mode</div>
        {/if}

        <div class="align">
            {#if import.meta.env.DEV}
                <button class="button is-link" on:click={() => ($developerMode = !$developerMode)}>
                    Developer mode: {$developerMode}
                </button>
            {/if}
            <button class="button is-link" on:click={getPyVersion}>getPyVersion</button>
        </div>
        <button class="button is-link" on:click={() => (showServerControls = !showServerControls)}>
            Show server controls
            {#if !$pyServerReady}
                <Badge class="has-background-danger" />
            {/if}
        </button>
        <div id="serverControllers" class="align server-control" class:hide={!showServerControls && $pyServerReady}>
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
                    class="button is-danger"
                    on:click={() => {
                        serverInfo = []
                    }}>Clear</button
                >
            </div>
        </div>

        <div id="serverInfo__div" class="align box">
            {#each serverInfo as info (info)}
                <span class="has-text-{info.type}" style="width: 100%;">>> {info.value}</span>
            {/each}
        </div>
    </div>
</div>

<style>
    #serverInfo__div {
        display: flex;
        align-content: flex-start;
        overflow: auto;
        user-select: text;
        white-space: pre-wrap;
        align-items: baseline;
        height: calc(42vh - 5rem);
        max-height: calc(42vh - 5rem);
    }
</style>
