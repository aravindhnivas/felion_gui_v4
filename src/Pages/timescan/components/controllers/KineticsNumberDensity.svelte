<script lang="ts">
    import { Modal, Select, TextAndSelectOptsToggler } from '$src/components'
    import NumberDensity from '$src/Pages/misc/NumberDensity.svelte'
    import { activePage } from '$src/sveltewritables'
    import { tweened } from 'svelte/motion'
    import { cubicOut } from 'svelte/easing'
    export let nHe = ''
    export let selectedFile = ''
    export let active = false
    export let configDir = ''
    export let useParamsFile = false
    export let fileCollections = []

    let filename = 'kinetics.conditions.json'
    const update_file_kinetic = async (_loc: string, _file: string) => {
        savefilename = await path.join(_loc, _file)
    }
    $: update_file_kinetic(configDir, filename)
    let savefilename = ''
    let contents = {}

    $: if (useParamsFile) {
        readConfigFile(false)
    }
    const readConfigFile = async (toast = true) => {
        await update_file_kinetic(configDir, filename)
        if (!(await fs.exists(savefilename))) {
            if ($activePage === 'Kinetics') {
                const errMsg = 'No config file found. Just compute and press save to create one'
                console.error(errMsg)
                return window.createToast(errMsg, 'danger')
            }
            return
        }
        const [_err, content] = await oO(fs.readTextFile(savefilename))
        if (_err) return window.handleError(_err)
        contents = tryF(() => JSON.parse(content))
        if (isError(contents)) return window.handleError(contents)

        if (toast) window.createToast('file read: ' + (await path.basename(savefilename)))
        return await compute()
    }

    let updateCurrentConfig
    let get_datas

    const save_datas = async () => {
        if (!get_datas) return window.createToast('No data computed', 'danger')
        if (get_datas === null) return window.createToast('Data is not yet full computed')
        if (Object.keys(get_datas).length === 0) return

        contents[selectedFile] = get_datas

        const [_err] = await oO(fs.writeTextFile(savefilename, JSON.stringify(contents, null, 4)))
        if (_err) return window.handleError(_err)

        const [_err2, content] = await oO(fs.readTextFile(savefilename))
        if (_err2) return window.handleError(_err2)
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

    $: if (!contents_loading_from_config && selectedFile) {
        nHe = null
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
    let loaded_contents = {}
    let contents_loading_from_config = false
    let loaded_contents_saved = true

    const loaded_percent = tweened(0, {
        duration: 400,
        easing: cubicOut,
    })

    const save_loaded_contents = async () => {
        const [_err] = await oO(fs.writeTextFile(savefilename, JSON.stringify(loaded_contents, null, 4)))
        if (_err) return window.handleError(_err)
        window.createToast(`File saved to ${await path.basename(savefilename)}`, 'success')
        loaded_contents_saved = true
        await readConfigFile()
    }

    const loadFromConfigFile = async () => {
        if (!config_file) return window.createToast('No config file loaded')

        contents_loading_from_config = true
        const content = await fs.readTextFile(config_file)
        const config_contents = tryF(() => JSON.parse(content))
        if (isError(config_contents)) return window.handleError(config_contents)

        window.createToast(`File read: ${await path.basename(config_file)}`)
        const keys = Object.keys(config_contents)

        loaded_contents = {}
        let counter = 0
        $loaded_percent = 0

        for (const key of keys) {
            await tick()
            const config = config_contents[key]
            set_minimal_config?.(config)
            const data = await computeNumberDensity(null, true)
            loaded_contents[key] = data
            selectedFile = key
            counter += 1
            $loaded_percent = (counter / keys.length) * 100
        }
        contents_loading_from_config = false
        loaded_contents_saved = false

        if (
            !(await dialog.confirm('Do you want to save the loaded contents?', {
                title: `${await path.basename(savefilename)}`,
            }))
        )
            return
        await save_loaded_contents()
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
                    <span class="tag is-warning">savelocation</span>
                    <span class="tag is-warning"> {configDir}</span>
                </div>
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

    <svelte:fragment slot="footerbtn">
        {#if (contents_loading_from_config || !loaded_contents_saved) && $loaded_percent > 0}
            <div class="icon-footer">
                <span>loading {$loaded_percent.toFixed(0)} %</span>
                {#if $loaded_percent < 100}
                    <lord-icon trigger="loop" src="/assets/icons/lottie/loader.json" />
                {:else}
                    <lord-icon trigger="hover" src="/assets/icons/lottie/confetti.json" />
                {/if}
            </div>
        {/if}
        {#if config_file}
            {#await path.basename(config_file) then value}
                <span class="tag is-warning">{value}</span>
            {/await}
        {/if}

        <button class="button is-warning" on:click={async () => await browseFromConfigFile()}>browse config file</button
        >
        <button class="button is-warning" on:click={async () => await loadFromConfigFile()}>load config file</button>
        <button class="button is-success has-green-background" on:click={async () => await save_datas()}>Save</button>
        {#if !loaded_contents_saved}
            <button class="button is-warning" on:click={async () => await save_loaded_contents()}
                >save loaded config</button
            >
        {/if}
    </svelte:fragment>
</Modal>
