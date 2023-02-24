<script lang="ts">
    import { persistentWritable } from '$src/js/persistentStore'
    import { Checkbox, Modal, Select, STable, Textfield } from '$src/components'

    export let configDir = ''
    export let active = false
    export let fileCollections: string[] = []

    let selectedFile = fileCollections[0] ?? ''
    const configKeys = ['filename', 'srgMode', 'pbefore', 'pafter', 'C_factor', 'temp']
    const defaultRow = persistentWritable('kinetics_numberdensity_default_row', {
        pbefore: '5e-5',
        pafter: '',
        C_factor: '1',
        temp: '5',
    })

    let srgMode = true

    const config_filename = persistentWritable('kinetics_config_filename', 'kinetics.configs.json')
    let config_datas = []

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
</script>

<Modal bind:active title="Kinetics config table">
    <svelte:fragment slot="body_header__div">
        <div class="align mb-2">
            <div class="align tag is-warning">Default row value</div>
            <Checkbox bind:value={srgMode} label="srgMode" />
            {#each Object.keys($defaultRow) as label}
                <Textfield style="width: 5em;" bind:value={$defaultRow[label]} {label} />
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
        <Select bind:value={selectedFile} label="filename" options={fileCollections} />
        <button class="button is-warning" on:click={addRow}>Add row</button>
    </svelte:fragment>
</Modal>
