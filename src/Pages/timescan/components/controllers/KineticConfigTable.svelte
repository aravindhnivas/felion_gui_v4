<script lang="ts">
    import { persistentWritable } from '$src/js/persistentStore'
    import { Checkbox, Modal, Select, STable, Textfield } from '$src/components'
    import { compute_number_density } from '$src/Pages/misc/numberDensity'

    export let configDir = ''
    export let active = false
    export let fileCollections: string[] = []
    export let config_datas = []

    let includeTranspiration = true
    let selectedFile = fileCollections[0] ?? ''

    const configKeys = ['filename', 'srgMode', 'pbefore', 'pafter', 'C_factor', 'temp', 'ND']
    const defaultRow = persistentWritable('kinetics_numberdensity_default_row', {
        pbefore: '5e-5',
        pafter: '',
        C_factor: '1',
        temp: '5',
    })

    const units = {
        pbefore: 'mbar',
        pafter: 'mbar',
        C_factor: '',
        temp: 'K',
    }

    let srgMode = true

    const config_filename = persistentWritable('kinetics_config_filename', 'kinetics.configs.json')
    // let config_datas = []

    const rowKeyCheck = () => {
        const pafterNullLists = config_datas.filter((d) => !d.pafter)
        const status = pafterNullLists.length === 0
        if (!status) {
            dialog.message(
                `The following index have no value for pafter: ${pafterNullLists.map((d, ind) => ind + 1).join(', ')}`,
                { title: 'invalid pafter value', type: 'error' }
            )
        }
        return status
    }

    // $: if (selectedFile) {
    //     const ind = config_datas.findIndex((d) => d.filename === selectedFile)
    //     nHe = config_datas?.[ind]?.ND ?? ''
    //     console.log(config_datas, config_datas?.[ind], { nHe })
    // }

    const addRow = async () => {
        if (!selectedFile)
            return dialog.message('Please select a filename', { title: 'No filename selected', type: 'error' })
        if (config_datas.find((d) => d.filename === selectedFile)) {
            if (await dialog.confirm(`The row for ${selectedFile} already exists. Do you want to overwrite it?`)) {
                const ind = config_datas.findIndex((d) => d.filename === selectedFile)
                config_datas[ind] = { ...$defaultRow, filename: selectedFile, srgMode, id: window.getID() }
            }
            return
        }

        config_datas = [...config_datas, { ...$defaultRow, filename: selectedFile, srgMode, id: window.getID() }]
    }

    const compute = async (e: Event, config) => {
        const srgMode = JSON.parse(config.srgMode)
        const added_pressure = config.pafter
        const background_pressure = config.pbefore
        const trap_temperature = config.temp
        const calibration_factor = config.C_factor

        const args = {
            srgMode,
            added_pressure,
            trap_temperature,
            background_pressure,
            calibration_factor,
        }
        const [_err, out] = await oO(compute_number_density(e, args))
        if (_err || !out) return
        const { nHe, nHe_transpiration } = out.numberDensity
        return includeTranspiration ? nHe_transpiration : nHe
    }

    const computeND = async (e: Event) => {
        if (computeAll) {
            let ind = 0
            for (const config of config_datas) {
                const nHe = await compute(e, config)
                if (!nHe) return
                config_datas[ind].ND = nHe
                ind += 1
            }
            return
        }
        const configInd = config_datas.findIndex((d) => d.filename === selectedFile)
        const config = config_datas[configInd]
        if (!config) return
        const nHe = await compute(e, config)
        if (!nHe) return
        config_datas[configInd].ND = nHe
    }

    let computeAll = false
</script>

<Modal bind:active title="Kinetics config table">
    <svelte:fragment slot="body_header__div">
        <div class="align mb-2">
            <div class="align tag is-warning">Default row value</div>
            <Checkbox bind:value={srgMode} label="srgMode" />
            {#each Object.keys($defaultRow) as label}
                <Textfield style="width: 7em;" bind:value={$defaultRow[label]} label={`${label}: ${units[label]}`} />
            {/each}
        </div>
    </svelte:fragment>
    <svelte:fragment slot="content">
        <STable
            rowKeys={configKeys}
            bind:rows={config_datas}
            {configDir}
            options_filter={'.configs.json'}
            bind:filename={$config_filename}
            editable={true}
            sortable={true}
            closeableRows={true}
            fileReadProps={{ singleFilemode_ObjectKey: 'filename', uniqFilter: 'id', rowKeyCheck }}
        />
    </svelte:fragment>
    <svelte:fragment slot="footerbtn">
        <Checkbox bind:value={includeTranspiration} label="includeTranspiration" />
        <Checkbox bind:value={computeAll} label="computeAll" />
        <Select bind:value={selectedFile} label="filename" options={fileCollections} />
        <button class="button is-warning" on:click={addRow}>Add row</button>
        <button class="button is-link" on:click={computeND}>Compute ND</button>
    </svelte:fragment>
</Modal>
