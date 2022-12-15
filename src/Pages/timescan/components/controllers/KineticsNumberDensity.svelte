<script lang="ts">
    import { onMount } from 'svelte'
    import Modal from '$components/modal/Modal.svelte'
    import Select from '$components/Select.svelte'
    import NumberDensity from '$src/Pages/misc/NumberDensity.svelte'
    import TextAndSelectOptsToggler from '$src/components/TextAndSelectOptsToggler.svelte'
    import { activePage } from '$src/sveltewritables'
    import { dialog, fs, path } from '@tauri-apps/api'

    export let nHe = ''
    export let selectedFile = ''
    export let active = false

    export let configDir = ''
    export let fileCollections = []

    let filename = 'kinetics.conditions.json'
    const update_file_kinetic = async (_loc: string, _file: string) => {
        savefilename = await path.join(_loc, _file)
    }
    $: update_file_kinetic(configDir, filename)
    let savefilename = ''
    let contents = {}

    $: if (savefilename) {
        readConfigFile()
    }

    const readConfigFile = async (toast = true) => {
        if (!(await fs.exists(savefilename))) {
            if ($activePage === 'Kinetics') {
                return window.createToast('No config file found. Just compute and press save to create one', 'danger')
            }
            return
        }
        const content = await fs.readTextFile(savefilename)
        contents = tryF(() => JSON.parse(content))
        if (isError(contents)) return window.handleError(contents)

        if (toast) window.createToast('file read: ' + (await path.basename(savefilename)))
        return await compute()
    }

    onMount(async () => {
        await readConfigFile(false)
    })

    let updateCurrentConfig
    let get_datas

    const save_datas = async () => {
        if (!get_datas) return window.createToast('No data computed', 'danger')
        if (get_datas === null) return window.createToast('Data is not yet full computed')
        if (Object.keys(get_datas).length === 0) return

        contents[selectedFile] = get_datas

        const result = await tryF(fs.writeTextFile(savefilename, JSON.stringify(contents, null, 4)))
        if (isError(result)) return window.handleError(result)

        const content = await fs.readTextFile(savefilename)
        contents = tryF(() => JSON.parse(content))
        if (isError(contents)) return window.handleError(contents)
        window.createToast(`File saved to ${await path.basename(savefilename)} for ${selectedFile}`)
    }

    const compute = async () => {
        if (!updateCurrentConfig) return
        const currentConfig = contents?.[selectedFile]
        if (active && !currentConfig) return
        return await updateCurrentConfig(currentConfig)
    }

    $: if (selectedFile) {
        compute()
    }

    let config_file = ''
    const browseFromConfigFile = async () => {
        config_file = ''
        const result = (await dialog.open({
            directory: false,
            filters: [{ name: 'JSON', extensions: ['configs.json'] }],
        })) as string
        if (!result) return
        config_file = result
    }

    const loadFromConfigFile = async () => {
        if (!config_file) return window.createToast('No config file loaded')
        const content = await fs.readTextFile(config_file)
        const config_contents = tryF(() => JSON.parse(content))
        if (isError(config_contents)) return window.handleError(config_contents)

        window.createToast(`File read: ${await path.basename(config_file)}`)

        const keys = Object.keys(config_contents)
        const contents = {}
        for (const key of keys) {
            const config = config_contents[key]
            set_minimal_config?.(config)
            const data = await computeNumberDensity(null, true)
            contents[key] = data
        }

        const result = await tryF(fs.writeTextFile(savefilename, JSON.stringify(contents, null, 4)))
        if (isError(result)) return window.handleError(result)
        window.createToast(`File saved to ${await path.basename(savefilename)}`, 'success')
        await readConfigFile()
    }

    let computeNumberDensity = null
    let set_minimal_config = null
</script>

<svelte:window
    on:keydown={(e) => {
        if (active && e.ctrlKey && e.key.toLocaleLowerCase() === 's') {
            save_datas()
        }
    }}
/>
<Modal bind:active title="{selectedFile}: {nHe} cm-3" id="kinetis-number-density" on:mounted={compute}>
    <svelte:fragment slot="content">
        <NumberDensity
            bind:computeNumberDensity
            bind:set_minimal_config
            bind:updateCurrentConfig
            on:getValue={(e) => {
                nHe = e.detail.nHe
            }}
            on:fullargs={(e) => {
                get_datas = e.detail.data
            }}
        >
            <svelte:fragment slot="header">
                <div class="align h-center">
                    <TextAndSelectOptsToggler
                        bind:value={filename}
                        label="config file (*.conditions.json)"
                        lookFor=".conditions.json"
                        lookIn={configDir}
                    />
                    <button class="button is-link" on:click={async () => await readConfigFile()}>Read file</button>
                    <Select bind:value={selectedFile} label="Filename" options={fileCollections} />
                    <span class="tag is-success" class:is-danger={!contents?.[selectedFile]}>
                        config {contents?.[selectedFile] ? 'found' : 'not found'}
                    </span>
                </div>
            </svelte:fragment>
        </NumberDensity>
    </svelte:fragment>
    <svelte:fragment slot="footer">
        <button class="button is-warning" on:click={async () => await browseFromConfigFile()}>browse config file</button
        >
        <button class="button is-warning" on:click={async () => await loadFromConfigFile()}>load config file</button>
        <button class="button is-success has-green-background" on:click={async () => await save_datas()}>Save</button>
    </svelte:fragment>
</Modal>