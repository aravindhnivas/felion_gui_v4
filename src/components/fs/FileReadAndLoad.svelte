<script lang="ts">
    import { isEmpty, uniqBy } from 'lodash-es'
    import { Textfield, TextAndSelectOptsToggler } from '$src/components'
    import MenuSurface from '@smui/menu-surface'
    import type { MenuSurfaceComponentDev } from '@smui/menu-surface'
    export let configDir: string = ''
    export let selectedFile: string = ''
    export let options_filter: string = '.json'
    export let useTaggedFile: boolean = false
    export let useParamsFile: boolean = false
    export let tagFile: string = ''
    export let filename = ''
    export let data_loaded = false
    export let dataToSave
    export let singleFilemode = false
    export let singleFilemode_ObjectKey = null
    export let uniqFilter = null

    let surface: MenuSurfaceComponentDev

    // console.log({ filename, configDir })
    const toastOpts = {
        target: 'left',
    }

    const save_data = async () => {
        if (isEmpty(dataToSave)) {
            window.createToast('No data to save', 'danger', toastOpts)
            return
        }

        if (!filename.endsWith(options_filter)) {
            filename = `${filename}${options_filter}`
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

    export const load_data = async (toast = true) => {
        // await tick()

        data_loaded = false
        const loadfilename = await path.join(configDir, filename)

        if (!(await fs.exists(loadfilename))) {
            return window.createToast(`File does not exists. Save it first.`, 'danger', toastOpts)
        }

        const content = await fs.readTextFile(loadfilename)
        const data = tryF(() => JSON.parse(content))
        if (isError(data)) return window.handleError(`Error reading ${filename}\n${data.message}`)

        if (singleFilemode) {
            if (singleFilemode_ObjectKey) {
                const keys = Object.keys(data)

                if (keys.length === 0) return window.createToast(`No data found`, 'danger', toastOpts)

                for (const key of keys) {
                    dataToSave = [{ [singleFilemode_ObjectKey]: key, ...data[key] }, ...dataToSave]
                }

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
            return window.createToast(`No data found for ${selectedFile} file`, 'danger', toastOpts)
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
        load_data(false)
    }
</script>

<div class="container mb-5">
    <button class="button is-warning" on:click={async () => await load_data()}>Load</button>
    <TextAndSelectOptsToggler
        bind:value={filename}
        label={`config file (*${options_filter})`}
        lookFor={options_filter}
        lookIn={configDir}
        auto_init={true}
    />
    <button class="button is-link" on:click={save_data}>Save</button>
    <MenuSurface
        style="background: #9666db;"
        bind:this={surface}
        anchorCorner="BOTTOM_START"
        anchorMargin={{ top: 0, right: 0, bottom: 0, left: 0 }}
    >
        <div class="align p-5">
            <Textfield bind:value={configDir} label="save location" />
        </div>
    </MenuSurface>
    <span role="presentation" class="material-symbols-outlined" on:click={() => surface.setOpen(true)}> help </span>
</div>

<style>
    .container {
        align-items: center;
        display: flex;
        gap: 1em;
        margin-left: auto;
    }
</style>
