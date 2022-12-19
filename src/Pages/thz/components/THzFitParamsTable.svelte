<script lang="ts">
    import { Textfield, ModalTable, Checkbox } from '$src/components'
    import { plotlyEventsInfo } from '$src/js/functions'

    export let varyAll = false
    export let active = false
    export let paramsTable = []
    export let fitMethod = 'gaussian'
    export let currentLocation = ''

    const keys = ['freq', 'amp', 'fG', 'fL']
    let savefilename = 'thz_fit_params.json'
    const update_file_config = async (_loc: string) => {
        configDir = await path.join(_loc, 'CONFIGS')
    }
    $: update_file_config(currentLocation)
    let configDir = ''

    const update_file_params_save = async (_loc: string, _file: string) => {
        saveParamsToFile = await path.join(_loc, _file)
    }
    $: update_file_params_save(configDir, savefilename)
    let saveParamsToFile = ''

    const saveConfig = async () => {
        if (!(await fs.exists(configDir))) {
            await fs.createDir(configDir)
        }
        const dataToSave = { units: { freq: 'GHz', fG: 'MHz', fL: 'MHz' } }
        paramsTable.forEach((params) => {
            const { freq, amp, fG, fL } = params
            dataToSave[freq] = { amp, fG, fL }
        })

        const [_err] = await oO(fs.writeTextFile(saveParamsToFile, JSON.stringify(dataToSave, null, 4)))
        if (_err) return window.handleError(_err)
        window.createToast('file saved')
    }

    const loadConfig = async () => {
        if (!(await fs.exists(saveParamsToFile))) return window.createToast('No files saved yet', 'danger')

        const content = await fs.readTextFile(saveParamsToFile)
        const readParams = tryF(() => JSON.parse(content))
        if (isError(readParams)) return window.handleError(readParams)

        const frequencies = Object.keys(readParams).filter((key) => key !== 'units')
        paramsTable = frequencies.map((freq) => {
            const { amp, fG, fL } = readParams[freq]
            const id = window.getID()
            return { freq, amp, fG, fL, id }
        })
        window.createToast('Config loaded', 'warning')
    }

    const getValuesFromAnnotations = () => {
        paramsTable = []
        const annotations = $plotlyEventsInfo.thzPlot.annotations
        annotations.forEach((annotation) => {
            const { x, y } = annotation
            const fG = fitMethod === 'gaussian' || fitMethod === 'voigt' ? 1 : 0
            const fL = fitMethod === 'lorentz' || fitMethod === 'voigt' ? 1 : 0
            const newParams = {
                freq: Number(x).toFixed(6),
                amp: Number(y).toFixed(2),
                fG,
                fL,
                id: window.getID(),
            }
            paramsTable = [...paramsTable, newParams]
        })
    }
</script>

<ModalTable bind:active title="Config table" bind:rows={paramsTable} {keys} sortOption={true}>
    <svelte:fragment slot="header">
        <Textfield bind:value={savefilename} label="savefilename" style="width: 100%;" />
    </svelte:fragment>

    <svelte:fragment slot="footer">
        <div class="align">
            <Checkbox bind:value={varyAll} label="varyAll" />
            <button class="button is-link" on:click={getValuesFromAnnotations}>getValuesFromAnnotations</button>
            <button class="button is-link" on:click={saveConfig}>Save</button>
            <button class="button is-link" on:click={loadConfig}>Load</button>
            <button class="button is-danger" on:click={() => (paramsTable = [])}>Clear ALL</button>
        </div>
    </svelte:fragment>
</ModalTable>
