<script lang="ts">
    import { isEmpty, uniqBy } from 'lodash-es'
    import { TextAndSelectOptsToggler } from '$src/components'

    export let configDir: string = ''
    export let selectedFile: string = ''
    export let options_filter: string = '.json'
    export let useTaggedFile: boolean = false
    export let useParamsFile: boolean = false
    export let tagFile: string = ''
    export let filename = 'data'
    export let data_loaded = false

    export let dataToSave = []
    export let singleFilemode = false
    export let singleFilemode_ObjectKey = null
    export let uniqFilter = null
    export let style = ''
    export let rowKeyCheck: () => boolean = null
    export let custom_load_save_fuctions: {
        save: () => Promise<void> | void
        load: () => Promise<void> | void
    } = {
        save: null,
        load: null,
    }

    let className = ''
    export { className as class }

    const { save: custom_save_data, load: custom_load_data } = custom_load_save_fuctions

    // let surface: MenuSurfaceComponentDev

    // console.log({ filename, configDir })
    const toastOpts = {
        target: 'left',
    }

    export let save_data = async () => {
        if (rowKeyCheck) {
            if (!rowKeyCheck()) return
        }

        if (isEmpty(dataToSave)) {
            window.createToast('No data to save', 'danger', toastOpts)
            return
        }

        if (!filename.endsWith(options_filter)) {
            filename = `${filename}${options_filter}`
        }

        if (!(await fs.exists(configDir))) {
            const [_err] = await oO(fs.createDir(configDir))
            if (_err) return window.handleError(_err)
        }

        const savefilename = await path.join(configDir, filename)

        if (singleFilemode) {
            let saveDataForFile: Object = null
            if (singleFilemode_ObjectKey) {
                saveDataForFile = {}
                dataToSave.forEach((data) => {
                    saveDataForFile[data[singleFilemode_ObjectKey]] = {}
                    for (const key in data) {
                        if (key !== singleFilemode_ObjectKey) {
                            saveDataForFile[data[singleFilemode_ObjectKey]] = {
                                [key]: data[key],
                                ...saveDataForFile[data[singleFilemode_ObjectKey]],
                            }
                        }
                    }
                })
            }

            saveDataForFile ??= { default: dataToSave }

            const [_err] = await oO(fs.writeTextFile(savefilename, JSON.stringify(saveDataForFile, null, 4)))
            if (_err) return window.handleError(_err)
            return notify()
        }

        let data = {}
        if (await fs.exists(savefilename)) {
            const content = await fs.readTextFile(savefilename)

            data = tryF(() => JSON.parse(content))
            if (isError(data)) return window.handleError(data)
        }

        if (!selectedFile) return window.createToast('No file selected', 'danger', toastOpts)
        data[selectedFile] ??= { tags: {}, default: {} }

        if (useTaggedFile) {
            if (!tagFile) return window.createToast('No tag file selected', 'danger', toastOpts)
            data[selectedFile]['tags'][tagFile] = dataToSave
        } else {
            data[selectedFile]['default'] = dataToSave
        }

        const [_err] = await oO(fs.writeTextFile(savefilename, JSON.stringify(data, null, 4)))
        if (_err) return window.handleError(_err)

        data_loaded = true
        return notify()
    }

    const notify = (info: string = 'saved') => {
        console.log({ dataToSave })
        if (singleFilemode) {
            return window.createToast(`${filename} ${info}`, 'success', toastOpts)
        }
        window.createToast(`${filename} ${info} for ${selectedFile}`, 'success', toastOpts)
    }

    export let load_data = async (toast = true) => {
        dataToSave = []
        data_loaded = false
        const loadfilename = await path.join(configDir, filename)
        console.log(`loading data from ${loadfilename}`)

        if (!(await fs.exists(loadfilename))) {
            return window.createToast(`File does not exists. Save it first.`, 'danger', toastOpts)
        }

        const content = await fs.readTextFile(loadfilename)
        const data = tryF(() => JSON.parse(content))

        console.log({ data })
        if (isError(data)) return window.handleError(`Error reading ${filename}\n${data.message}`)

        if (singleFilemode) {
            console.log('file load in single file mode')
            if (singleFilemode_ObjectKey) {
                const keys = Object.keys(data)
                console.log('file load in single file mode with object key', { keys, singleFilemode_ObjectKey })

                if (keys.length === 0) return window.createToast(`No data found`, 'danger', toastOpts)

                for (const key of keys) {
                    const id = data[key]?.id ?? window.getID()
                    dataToSave = [{ [singleFilemode_ObjectKey]: key, ...data[key], id }, ...dataToSave]
                }
                // console.log({ dataToSave })

                if (uniqFilter) {
                    dataToSave = uniqBy(dataToSave, uniqFilter)
                }
                if (toast) notify('loaded')
                return
            }

            if (!data.default) return window.createToast(`default-mode: No data found`, 'danger', toastOpts)
            dataToSave = data.default
            data_loaded = true
            if (toast) notify('loaded')
            return
        }

        if (!data?.[selectedFile]) {
            return window.createToast(
                `No data found for ${selectedFile} (${options_filter} filetype)`,
                'danger',
                toastOpts
            )
        }
        if (useTaggedFile) {
            if (!tagFile) {
                return window.createToast(`Invalid tagFile name`, 'danger', toastOpts)
            }
            if (!data[selectedFile]?.['tags']) {
                return window.createToast('No tag column created for this file', 'danger', toastOpts)
            }
            if (!data[selectedFile]['tags'][tagFile]) {
                return window.createToast(`tag-mode: No data found for ${selectedFile} file`, 'danger', toastOpts)
            }
            data_loaded = true
            dataToSave = data[selectedFile]['tags'][tagFile]
            if (toast) notify('loaded')
            return
        }

        if (!data[selectedFile]['default']) {
            return window.createToast(`default-mode: No data found for ${selectedFile} file`, 'danger', toastOpts)
        }

        dataToSave = data[selectedFile]['default']
        data_loaded = true

        if (toast) notify('loaded')
        return
    }

    $: if (!singleFilemode && selectedFile && (useParamsFile || useTaggedFile)) {
        custom_load_data ? custom_load_data() : load_data(false)
    }

    onMount(() => {
        if (filename && !filename.endsWith(options_filter)) {
            filename = `${filename}${options_filter}`
        }
    })
</script>

<div class="container mb-5 {className}" {style}>
    {#if custom_load_data}
        <button class="button is-warning" on:click={custom_load_data}>Load</button>
    {:else}
        <button class="button is-warning" on:click={async () => await load_data()}>Load</button>
    {/if}

    <TextAndSelectOptsToggler
        bind:value={filename}
        label={`config file (*${options_filter})`}
        lookFor={options_filter}
        lookIn={configDir}
        auto_init={true}
    />

    {#if custom_save_data}
        <button
            class="button is-link"
            on:click={async () => {
                if (!(await fs.exists(configDir))) {
                    const [_err] = await oO(fs.createDir(configDir))
                    if (_err) return window.handleError(_err)
                }
                await custom_save_data()
            }}>Save</button
        >
    {:else}
        <button class="button is-link" on:click={save_data}>Save</button>
    {/if}
    <button
        class="i-material-symbols-folder-open-outline"
        on:click={async () => {
            // await dialog.message(configDir, { title: 'save location' })
            await shell.open(configDir)
        }}
    />
</div>

<style>
    .container {
        align-items: center;
        display: flex;
        gap: 1em;
        margin-left: auto;
    }
</style>
