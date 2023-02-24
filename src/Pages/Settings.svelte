<script lang="ts">
    import { currentTab } from '$lib/pyserver/stores'
    import Changelog from '$src/components/misc/Changelog.svelte'
    import { Configuration, About, Update, Credits, Console } from './settings/components/'
    import { Badge } from '$src/components'
    import { LOGGER, python_asset_ready, assets_installation_required } from './settings/utils/stores'
    import { updateInterval } from '$src/sveltewritables'
    import { check_felionpy_assets_status } from './settings/utils/assets-status'
    import { unZIP } from './settings/utils/download-assets'

    const tabs = ['Configuration', 'Update', 'About', 'Credits', 'Console']
    const id = 'Settings'

    let display = 'none'
    let navbarBadgeSettings: HTMLElement
    let updateBadge: HTMLElement
    let configBadge: HTMLElement

    let updateIntervalCycle: NodeJS.Timer | null = null

    onMount(async () => {
        display = localStorage.getItem('active_tab') === id ? 'block' : 'none'
        updateBadge = document.getElementById(`settings-badge-Update`)
        configBadge = document.getElementById(`settings-badge-Configuration`)
        navbarBadgeSettings = document.getElementById(`navbar-badge-${id}`)
    })

    onDestroy(() => {
        navbarBadgeSettings.style.backgroundColor = ''
        if (updateIntervalCycle) {
            console.warn('Update interval cleared')
            clearInterval(updateIntervalCycle)
        }
    })

    let start_and_check_felionpy: () => Promise<void> = null
    let check_for_update: () => Promise<void> = null

    const warningStatuses = [false, false]

    const updateSettingStatus = async () => {
        const no_active_status = warningStatuses.every((element) => element === false)
        navbarBadgeSettings.style.backgroundColor = no_active_status ? '' : 'var(--color-danger)'
    }

    onMount(async () => {
        LOGGER.info('Settings page mounted')
        if (import.meta.env.DEV) return
        updateIntervalCycle = setInterval(check_for_update, $updateInterval * 60 * 1000)

        if ($assets_installation_required) {
            const [_err] = await oO(unZIP(false))
        }

        await check_felionpy_assets_status()
        await start_and_check_felionpy()
        await check_for_update()
    })
</script>

<Changelog />

<section class="section animate__animated animate__fadeIn" {id} style="display:{display}">
    <div class="main__div">
        <div class="box interact left_container__div">
            <div class="title__div">
                {#each tabs as tab (tab)}
                    <div
                        role="presentation"
                        class="hvr-glow"
                        class:clicked={$currentTab === tab}
                        on:click={() => ($currentTab = tab)}
                    >
                        <span class="mr-3">{tab}</span>
                        <Badge id="settings-badge-{tab}" />
                    </div>
                {/each}
            </div>
        </div>

        <div class="mainContainer box">
            <Configuration
                bind:start_and_check_felionpy
                on:serverStatusChanged={({ detail: { closed } }) => {
                    console.log('server closed', closed)
                    configBadge.style.backgroundColor = closed ? 'var(--color-danger)' : ''
                    warningStatuses[0] = closed
                    updateSettingStatus()
                }}
            />

            <Update
                bind:check_for_update
                on:updateStatusChange={(e) => {
                    warningStatuses[1] = false
                    if (e.detail.status !== 'update-downloaded') return
                    updateBadge.style.backgroundColor = 'var(--color-danger)'
                    warningStatuses[1] = true
                    updateSettingStatus()
                }}
            />
            <About />
            <Credits />
            <Console />
        </div>
    </div>
</section>

<style lang="scss">
    .mainContainer {
        height: 100%;
    }
    section {
        margin: 0;
        padding: 0;
    }
    .clicked {
        border-bottom: solid 1px;
    }
    .main__div {
        display: grid;
        grid-template-columns: 1fr 4fr;
        column-gap: 3em;
        height: calc(100vh - 7rem);

        .box {
            margin-bottom: 0px;
            border-radius: 0;
            background-color: #6a50ad8a;
        }

        .title__div {
            letter-spacing: 0.1em;
            text-transform: uppercase;
            // text-align: center;
            text-align: end;
            cursor: pointer;
            display: grid;
            row-gap: 2em;
            div {
                font-size: 22px;
            }
        }
    }
    .mainContainer {
        overflow: auto;
    }
</style>
