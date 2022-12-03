<script lang="ts">
    import {
        collisionalCoefficient_balance,
        collisionalCoefficient,
        collisionalRates,
        collisionalRateConstants,
    } from '../stores/collisional'
    import { numberDensity, collisionalTemp, configLoaded } from '../stores/common'
    import BrowseTextfield from '$src/components/BrowseTextfield.svelte'
    import Textfield from '@smui/textfield'
    import { find, cloneDeep, isEmpty } from 'lodash-es'
    import { tick } from 'svelte'

    import balance_distribution from '../functions/balance_distribution'
    import CollisionalDistribution from '../windows/CollisionalDistribution.svelte'
    import CollisionalRateConstantPlot from '../windows/CollisionalRateConstantPlot.svelte'
    import Panel from '$src/components/Panel.svelte'
    import Clipboard from 'svelte-clipboard'
    import { makeTableRow, makeTable, formatNumber } from '../functions/utils'
    import { fs, path } from '@tauri-apps/api'

    export let collisionalFilename = ''
    export let moleculeName = ''
    export let tagName = ''

    let activate_collisional_simulation_window = false

    const compteCollisionalBalanceConstants = () => {
        $collisionalCoefficient_balance = []

        $collisionalCoefficient.forEach((coefficient) => {
            const { label, value } = coefficient
            const levelLabels = label.split(' --> ').map((f) => f.trim())

            const balance = balance_distribution({ collisionalTemp: $collisionalTemp, label })
            if (balance === null) return

            const newValue = Number(value) * balance
            const newLabel = `${levelLabels[1]} --> ${levelLabels[0]}`

            const alreadyComputed = find($collisionalCoefficient, (rate) => rate.label == newLabel)
            if (!alreadyComputed) {
                $collisionalCoefficient_balance = [
                    ...$collisionalCoefficient_balance,
                    {
                        label: newLabel,
                        value: newValue.toExponential(3),
                        id: window.getID(),
                    },
                ]
            }
        })
    }

    const computeRate = (rate: ValueLabel) => {
        const value = Number(rate.value) * Number($numberDensity)
        rate.value = value.toExponential(3)
        return rate
    }

    $: if ($collisionalRateConstants.length > 0 && $numberDensity) {
        $collisionalRates = cloneDeep($collisionalRateConstants).map(computeRate)
    }

    let OpenRateConstantsPlot = false

    const saveCollisionalRateConstants = async () => {
        if (!(await fs.exists(collisionalCoefficientJSONFile))) return
        const save_dir = await path.dirname(collisionalCoefficientJSONFile)
        if (!(await fs.exists(save_dir))) {
            return window.createToast(`Directory ${save_dir} does not exist`, 'danger')
        }

        const saveJSON = {
            $collisionalCoefficient,
            $collisionalCoefficient_balance,
        }

        const result = await tryF(fs.writeTextFile(collisionalCoefficientJSONFile, JSON.stringify(saveJSON, null, 4)))
        if (isError(result)) return window.handleError(result)

        console.log(`${collisionalCoefficientJSONFile} saved`)
        window.createToast('Saved: ' + (await path.basename(collisionalCoefficientJSONFile)))
    }

    const update_config_dir = async (_loc: string) => {
        if (!(await fs.exists(_loc))) return
        configFileDir = await path.dirname(_loc)
    }
    $: update_config_dir(collisionalFilename)
    let configFileDir = ''

    const update_collsional_file = async (_loc: string) => {
        collisionalCoefficientJSONFile = await path.join(_loc, 'collisionalCoefficients.json')
    }
    $: update_collsional_file(configFileDir)
    let collisionalCoefficientJSONFile = ''

    const readcollisionalCoefficientJSONFile = async (toast = true) => {
        if (!(await fs.exists(collisionalCoefficientJSONFile))) {
            if (!toast) return console.warn(`${collisionalCoefficientJSONFile} does not exist`)
            return window.createToast('File not found', 'danger')
        }

        console.log('loading: ', collisionalCoefficientJSONFile)

        const content = await fs.readTextFile(collisionalCoefficientJSONFile)
        const data = tryF(() => JSON.parse(content))
        if (isError(data)) return window.handleError(data)

        if (isEmpty(data)) return window.createToast('Collisional data file is empty', 'danger')
        ;({ $collisionalCoefficient, $collisionalCoefficient_balance } = data)

        if (localStorage.getItem('active_tab') !== 'Kinetics') return

        window.createToast('loaded: ' + (await path.basename(collisionalCoefficientJSONFile)), 'warning', {
            target: 'left',
        })
    }

    const after_configs_loaded = async () => {
        await tick()
        await readcollisionalCoefficientJSONFile()
    }
    $: if ($configLoaded) {
        after_configs_loaded()
    }

    let fullTable = ''

    const copyAsTeXTable = () => {
        const caption = `Derived collisional rates at $T=${$collisionalTemp}$ K, ${moleculeName} collision with ${tagName} [${formatNumber(
            $numberDensity
        )} cm$^{-3}$ number density] for an initial $|i\\rangle$ state transitions into final $|j\\rangle$ state via $k_{ij}$ rate coefficients [in cm$^3$/s] and $R_{ij}$ rate [in s$^{-1}$].`

        const label = `tab:collisional-rate-coefficients`

        let body = ''
        const table = $collisionalCoefficient.map((rate) => makeTableRow(rate, $numberDensity)).join('\n\t\t')
        const table_balance = $collisionalCoefficient_balance
            .map((rate) => makeTableRow(rate, $numberDensity))
            .join('\n\t\t')
        body += `\n\t\t${table}`
        if (!isEmpty(table_balance)) {
            body += `\n\t\t\\\\`
            body += `\n\t\t${table_balance}`
        }
        const column_align = 'rclll'
        const header = `i && j & $k_{ij}$ & $R_{ij}$`
        fullTable = makeTable(caption, label, column_align, header, body)
    }
</script>

<CollisionalDistribution bind:active={activate_collisional_simulation_window} {moleculeName} />
<CollisionalRateConstantPlot {collisionalFilename} bind:active={OpenRateConstantsPlot} />

<Panel label="Collisional rate constants" loaded={$numberDensity.length > 0 && $collisionalRateConstants.length > 0}>
    <div class="align h-center">
        <div class="align h-center">
            <BrowseTextfield
                dir={false}
                filetype="txt"
                class="three_col_browse"
                bind:value={collisionalFilename}
                label="collisionalFilename"
                lock={true}
                on:fileupdate={(e) => {
                    console.log(e)
                }}
            >
                <button class="button is-warning" on:click={async () => await readcollisionalCoefficientJSONFile()}
                    >load</button
                >
                <button class="button is-link" on:click={async () => await saveCollisionalRateConstants()}>Save</button>
            </BrowseTextfield>

            <Textfield bind:value={$collisionalTemp} label="collisionalTemp" />
            <button class="button is-warning" on:click={() => (OpenRateConstantsPlot = true)}
                >Derive rate from fit</button
            >

            <button class="button is-link " on:click={compteCollisionalBalanceConstants}>Compute balance rate</button>

            <button class="button is-link flex" on:click={() => (activate_collisional_simulation_window = true)}>
                <span>Simulate Collisional Cooling</span><span class="material-symbols-outlined">open_in_full</span>
            </button>

            <Clipboard
                text={fullTable}
                let:copy
                on:copy={() => {
                    window.createToast('Copied to clipboard', 'success')
                }}
            >
                <button
                    class="button is-warning"
                    on:click={async () => {
                        copyAsTeXTable()
                        await tick()
                        copy()
                    }}>copy as TeXTable</button
                >
            </Clipboard>
        </div>
    </div>

    {#if $collisionalCoefficient.length > 0}
        <div class="align h-center">
            {#each $collisionalCoefficient as { label, value, id } (id)}
                <Textfield bind:value {label} />
            {/each}
        </div>
    {/if}

    {#if $collisionalCoefficient_balance.length > 0}
        <hr />
        <div class="align h-center">
            {#each $collisionalCoefficient_balance as { label, value, id } (id)}
                <Textfield bind:value {label} />
            {/each}
        </div>
    {/if}
    <hr />
    <div class="align h-center subtitle">Collisional Rates (per sec)</div>
    <div class="align h-center">
        <Textfield bind:value={$numberDensity} label="numberDensity (cm-3)" />
    </div>

    <div class="align h-center">
        {#each $collisionalRates as { label, value, id } (id)}
            <Textfield bind:value {label} />
        {/each}
    </div>
</Panel>
