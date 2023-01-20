<script lang="ts">
    import { energyUnit, numberOfLevels, energyLevels, energyInfos } from '../stores/energy'
    import { excitedFrom, excitedTo } from '../stores/common'
    import Panel from '$src/components/Panel.svelte'
    import Select from '$src/components/Select.svelte'
    import IconButton, { Icon } from '@smui/icon-button'
    import Icon_unlock from 'virtual:icons/mdi/lock-off'
    import Icon_lock from 'virtual:icons/mdi/lock'
    import BrowseTextfield from '$src/components/BrowseTextfield.svelte'
    import { Textfield } from '$src/components'
    import type WinBox from 'winbox'
    import { wavenumberToMHz, MHzToWavenumber, getYMLFileContents, setID } from '$src/js/utils'
    import BoltzmanDistribution from '../windows/BoltzmanDistribution.svelte'
    export let energyFilename: string = ''

    let openBoltzmanWindow = false
    let boltzmanWindow: WinBox | null = null
    let lock_energylevels = true

    const readFile = async () => {
        if (!(await fs.exists(energyFilename))) return

        console.log(await path.basename(energyFilename), 'updating energy levels')
        let energyLevelsStore_NoKey: OnlyValueLabel<number>[] = []

        if (energyFilename) {
            ;({ levels: energyLevelsStore_NoKey, unit: $energyUnit } = await getYMLFileContents(energyFilename))
        } else {
            energyLevelsStore_NoKey = []
        }
        const energyLevelsStore: EnergyLevels = energyLevelsStore_NoKey
            .map((e) => ({ ...e, value: Number(e.value) }))
            .map(setID)

        $energyInfos[$energyUnit] = energyLevelsStore

        if ($energyUnit === 'cm-1') {
            $energyInfos['MHz'] = energyLevelsStore.map(wavenumberToMHz)
        } else {
            $energyInfos['cm-1'] = energyLevelsStore.map(MHzToWavenumber)
        }
        $numberOfLevels = energyLevelsStore.length

        await tick()
        $excitedFrom = energyLevelsStore?.[0].label
        $excitedTo = energyLevelsStore?.[1].label
    }
    $: if (energyFilename) {
        readFile()
    }
</script>

<BoltzmanDistribution bind:active={openBoltzmanWindow} bind:graphWindow={boltzmanWindow} />

<Panel label="Energy Levels" loaded={$energyLevels.length > 0}>
    <BrowseTextfield
        dir={false}
        filetype="yml"
        class="three_col_browse"
        bind:value={energyFilename}
        label="filename"
        lock={true}
    >
        <button class="button is-warning" on:click={readFile}>load</button>
    </BrowseTextfield>

    <div class="align h-center">
        <Textfield
            bind:value={$numberOfLevels}
            input$step={1}
            input$min={0}
            type={'number'}
            label="numberOfLevels (J levels)"
        />
        <Select options={['MHz', 'cm-1']} bind:value={$energyUnit} label="unit" />
        <button
            class="button is-link"
            on:click={() => {
                openBoltzmanWindow = true
                setTimeout(() => boltzmanWindow?.focus(), 100)
            }}
        >
            Show Boltzmann distribution
        </button>
        <IconButton toggle bind:pressed={lock_energylevels}>
            <Icon><Icon_unlock /></Icon>
            <Icon on><Icon_lock /></Icon>
        </IconButton>
    </div>

    <div class="align h-center">
        {#each $energyLevels as { label, value, id } (id)}
            <Textfield {value} {label} disabled={lock_energylevels} type="number" input$step="0.0001" />
        {/each}
    </div>
</Panel>
