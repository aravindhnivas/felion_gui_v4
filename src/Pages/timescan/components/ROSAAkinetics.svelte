<script lang="ts">
    import { persistentWritable } from '$src/js/persistentStore'
    import { onMount } from 'svelte'
    import {
        Panel,
        Select,
        Checkbox,
        Textfield,
        TextSwitch,
        ButtonBadge,
        BrowseTextfield,
        FileReadAndLoad,
        TextAndSelectOptsToggler,
    } from '$src/components'
    import LayoutDiv from '$src/layout/misc/LayoutDiv.svelte'
    import computePy_func from '$lib/pyserver/computePy'
    import KineticConfigTable from './controllers/KineticConfigTable.svelte'
    import KineticEditor from './KineticEditor.svelte'
    import MatplotlibDialog from './MatplotlibDialog.svelte'
    import RateConstants from './controllers/RateConstants.svelte'
    import RateInitialise from './controllers/RateInitialise.svelte'
    import KlossChannels from './controllers/channels/KlossChannels.svelte'
    import KineticsNumberDensity from './controllers/KineticsNumberDensity.svelte'
    import Accordion from '@smui-extra/accordion'

    const currentLocation = persistentWritable('kinetics_location', '')

    let timestartIndexScan = 0
    let fileCollections: string[] = []
    let molecule: string = 'CD'
    let tag: string = 'He'
    let nameOfReactants: string = ''
    let selectedFile = ''
    let totalMassKey: Timescan.MassKey[] = []

    const updateFiles = async () => {
        if (!(await fs.exists($currentLocation))) {
            return window.createToast('Invalid location', 'danger', { target: 'left' })
        }

        const [_err, dirs] = await oO(fs.readDir($currentLocation))
        if (_err) return window.handleError(_err)
        fileCollections = dirs
            .map((f) => f.name)
            .filter((f) => f.endsWith('_scan.json'))
            .map((f) => f.split('.')[0].replace('_scan', '.scan'))
        // console.log(fileCollections)
        selectedFile ||= fileCollections[0]
    }

    $: if ($currentLocation) {
        updateFiles()
    }

    let currentData: Timescan.Data
    let currentDataBackup: Timescan.Data

    const sliceSUM = () => {
        const newData: Timescan.PlotData = structuredClone(currentDataBackup).SUM
        currentData.SUM.x = newData.x.slice(timestartIndexScan)
        currentData.SUM.y = newData.y.slice(timestartIndexScan)
        currentData['SUM']['error_y']['array'] = newData['error_y']['array'].slice(timestartIndexScan)
    }

    const sliceData = (compute = true) => {
        console.log('slicing data')
        if (!selectedFile.endsWith('.scan')) return

        totalMassKey.forEach(({ mass }) => {
            const newData: Timescan.PlotData = structuredClone(currentDataBackup)[mass]
            if (!newData) return window.createToast(`${mass} not found`, 'danger', { target: 'left' })
            newData.x = newData.x.slice(timestartIndexScan)
            newData.y = newData.y.slice(timestartIndexScan)
            newData['error_y']['array'] = newData['error_y']['array'].slice(timestartIndexScan)
            currentData[mass] = newData
        })

        sliceSUM()

        if (useParamsFile) {
            const masses = totalMassKey.filter((m) => m.included).map(({ mass }) => mass.trim())
            const parentCounts = Number(currentData?.[masses[0]]?.['y']?.[0])?.toFixed(0)
            if (!defaultInitialValues) return
            initialValues = [parentCounts, ...Array(masses.length - 1).fill(1)].join(', ')

            return
        }

        if (compute) {
            computeOtherParameters()
        }
    }

    let maxTimeIndex = 5

    async function computeParameters() {
        console.log('compute parameters')
        tagFile = ''
        timestartIndexScan = 0
        loss_channels = []

        if (!selectedFile) return window.createToast('No file selected', 'danger')
        const currentJSONfile = await path.join($currentLocation, selectedFile.replace('.scan', '_scan.json'))
        const [_err, content] = await oO(fs.readTextFile(currentJSONfile))
        if (_err) return window.handleError(_err)

        currentData = tryF(() => JSON.parse(content))
        if (isError(currentData)) {
            window.handleError(currentData)
            return
        }

        currentDataBackup = structuredClone(currentData)
        console.log({ currentData })
        const totalMass = Object.keys(currentData).filter((m) => m !== 'SUM')
        totalMassKey = totalMass.map((m) => ({
            mass: m,
            id: window.getID(),
            included: true,
        }))
        maxTimeIndex = currentData[totalMass[0]].x.length - 5
        sliceData(false)
        computeOtherParameters()
    }
    let useParamsFile = false

    const kinetics_params_file = persistentWritable('kinetics_params_file', 'kinetics.params.json')

    const update_file = async (_loc: string, _file: string) => {
        paramsFile = await path.join(_loc, _file || '')
    }
    let paramsFile = ''
    $: update_file(configDir, $kinetics_params_file)

    $: paramsData = {
        legends,
        totalMassKey,
        initialValues,
        molecule,
        tag,
        nameOfReactants,
        timestartIndexScan,
        $fit_config_filename,
        kineticEditorFilename,
        tagFile,
    }
    let load_data_loss_channels

    const params_load = (data) => {
        ;({
            legends,
            totalMassKey,
            initialValues,
            molecule,
            tag,
            nameOfReactants,
            timestartIndexScan,
            kineticEditorFilename,
        } = data)

        if (!(molecule && tag)) {
            if (nameOfReactants) {
                molecule = nameOfReactants.split(',').at(0)
                tag = nameOfReactants.split(',').at(1).split(molecule).at(-1)
            }
        }
        if (data['$fit_config_filename']) {
            $fit_config_filename = data['$fit_config_filename']
        }

        if (data['tagFile']) {
            tagFile = data['tagFile']
        }
        load_data_loss_channels?.(false)
        params_found = true
    }

    const updateParamsFile = async () => {
        let contents = {}
        if (await fs.exists(paramsFile)) {
            const content = await fs.readTextFile(paramsFile)
            contents = tryF(() => JSON.parse(content))
            if (isError(contents)) {
                contents = {}
            }
        }

        contents[selectedFile] ??= { tag: {}, default: {} }
        contents[selectedFile].tag ??= {}
        contents[selectedFile].default ??= {}

        if (useTaggedFile) {
            if (tagFile.length === 0) {
                return window.createToast('Please select/write a tag name', 'danger', { target: 'left' })
            }
            contents[selectedFile].tag[tagFile] = paramsData
        } else {
            contents[selectedFile].default = paramsData
        }

        const [_err] = await oO(fs.writeTextFile(paramsFile, JSON.stringify(contents, null, 4)))
        if (_err) return window.handleError(_err)
        tagOptions = Object.keys(contents[selectedFile].tag)
        window.createToast(`saved: ${await path.basename(paramsFile)}`, 'success', {
            target: 'left',
        })
        params_found = true
    }

    let params_found = false
    let useTaggedFile = false
    let tagFile = ''
    let tagOptions: string[] = []

    const readFromParamsFile = async (event?: Event) => {
        params_found = false
        tagOptions = []
        if (!(useParamsFile && (await fs.exists(paramsFile)))) return

        const content = await fs.readTextFile(paramsFile)
        const data = tryF(() => JSON.parse(content))
        if (isError(data)) return window.createToast('no data found while reading file', 'danger', { target: 'left' })

        const contents = data[selectedFile]
        if (!contents) return window.createToast('no contents in the data', 'danger', { target: 'left' })

        if (contents.tag) {
            tagOptions = Object.keys(contents.tag)

            tagFile ||= tagOptions[0] || ''
        }
        let setContents = {}
        if (useTaggedFile) {
            if (!contents.tag?.[tagFile]) {
                return window.createToast('no data available for this tag', 'danger', { target: 'left' })
            }
            setContents = contents.tag[tagFile]
        } else {
            setContents = contents.default
        }
        if (!setContents) return window.createToast('no contents available while reading', 'danger', { target: 'left' })
        params_load(setContents)
    }

    let legends = ''

    function computeOtherParameters(forTagged = false) {
        readFromParamsFile()
        if (params_found) return

        const masses = totalMassKey.filter((m) => m.included).map(({ mass }) => mass.trim())
        if (masses.length < 2) return

        const parentCounts = Number(currentData?.[masses[0]]?.['y']?.[0])?.toFixed(0)
        if (forTagged) return
        if (defaultInitialValues) {
            initialValues = [parentCounts, ...Array(masses.length - 1).fill(1)].join(', ')
        }

        nameOfReactants = `${molecule}, ${molecule}${tag}`
        legends = `${molecule}$^+$, ${molecule}$^+$${tag}`
        // ;(ratek3 = 'k31'), (ratekCID = 'kCID1')

        for (let index = 2; index < masses.length; index++) {
            // ratek3 += `, k3${index}`
            // ratekCID += `, kCID${index}`
            nameOfReactants += `, ${molecule}${tag}${index}`
            legends += `, ${molecule}$^+$${tag}$_${index}$`
        }
    }

    // let numberDensity = 0

    const update_kinetic_filename = async (appendName: string) => {
        const name = await path.basename(selectedFile)
        kineticEditorFilename = name.split('.')[0] + appendName
    }
    $: if (selectedFile?.endsWith('.scan')) {
        computeParameters()
        update_kinetic_filename('-kineticModel.md')
    }
    $: if (tagFile) {
        update_kinetic_filename(`-${tagFile}-kineticModel.md`)
    }

    const update_dir = async (_loc: string) => {
        configDir = await path.join(_loc, '../configs')
    }
    let configDir = ''
    $: update_dir($currentLocation)

    async function kineticSimulation(e: ButtonClickEvent) {
        try {
            if (!selectedFile) {
                return window.handleError('Select a file')
            }
            if (!currentData) {
                return window.handleError('No data available')
            }
            if (!(await fs.exists(kineticfile))) {
                return window.handleError('Compute and save kinetic equation')
            }

            const masses = totalMassKey.filter((m) => m.included).map(({ mass }) => mass.trim())

            if (masses.length < 2) {
                return window.handleError('atleast two reactants are required for kinetics')
            }
            const nameOfReactantsArray = nameOfReactants.split(',').map((m) => m.trim())

            sliceData(false)

            const data = {}
            masses.forEach((mass, index) => {
                data[nameOfReactantsArray[index]] = currentData[mass]
            })
            data['SUM'] = currentData['SUM']
            let kinetic_plot_adjust_configs_obj = {}
            try {
                kinetic_plot_adjust_configs_obj = $kinetic_plot_adjust_configs
                    .replaceAll('=', ':')
                    .split(',')
                    .map((_v0) =>
                        _v0
                            .trim()
                            .split(':')
                            .map((_v1) => `"${_v1}"`)
                            .join(':')
                    )
                    .join()
                kinetic_plot_adjust_configs_obj = JSON.parse(`{${kinetic_plot_adjust_configs_obj}}`)
                console.log(kinetic_plot_adjust_configs_obj)
            } catch (error) {
                kinetic_plot_adjust_configs_obj = {}
            }
            const args = {
                tag,
                data,
                molecule,
                legends,
                selectedFile,
                numberDensity: nHe,
                $fit_config_filename,
                nameOfReactantsArray,
                kineticEditorFilename,
                kinetic_plot_adjust_configs_obj,
                kinetic_file_location: $currentLocation,
                initialValues: initialValues.split(','),
                useTaggedFile,
                tagFile,
            }
            computePy_func({ e, pyfile: 'kineticsCode', args, general: true })
        } catch (error) {
            window.handleError(error)
        }
    }

    let defaultInitialValues = true
    let initialValues = ''
    let kineticEditorFilename = ''

    const update_file_kinetic = async (_loc: string, _file: string) => {
        kineticfile = await path.join(_loc, _file)
    }

    $: update_file_kinetic($currentLocation, kineticEditorFilename)
    let kineticfile = ''
    let reportRead = false
    let reportSaved = false
    const fit_config_filename = persistentWritable('kinetics_fitted_values', 'kinetics.fit.json')
    let loss_channels: Timescan.LossChannel[] = []
    let rateConstantMode = false
    onMount(() => {
        selectedFile = fileCollections[0] || ''
    })

    let kinetic_plot_adjust_dialog_active = false
    let show_numberDensity = false
    let show_fileConfigs = false
    let nHe = ''
    const kinetic_plot_adjust_configs = persistentWritable(
        'kinetic_plot_adjust_configs',
        'top=0.905,\nbottom=0.135,\nleft=0.075,\nright=0.59,\nhspace=0.2,\nwspace=0.2'
    )
</script>

<MatplotlibDialog bind:open={kinetic_plot_adjust_dialog_active} bind:value={$kinetic_plot_adjust_configs} />
<KineticsNumberDensity
    bind:active={show_numberDensity}
    bind:nHe
    {selectedFile}
    {fileCollections}
    {configDir}
    {useParamsFile}
/>
<KineticConfigTable bind:active={show_fileConfigs} {configDir} />

<LayoutDiv id="ROSAA-kinetics">
    <svelte:fragment slot="header_content__slot">
        <BrowseTextfield
            class="three_col_browse box p-2"
            bind:value={$currentLocation}
            label="Timescan EXPORT data location"
        >
            <button class="button is-warning" on:click={async () => await updateFiles()}>load</button>
        </BrowseTextfield>
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <div class="main_container__div">
            <Accordion class="mb-2" multiple style="width: 100%;">
                <Panel loaded={nHe?.length > 0} label="Number density">
                    <Textfield value={nHe || ''} label="numberDensity" disabled />
                    <button
                        class="button is-link"
                        on:click={() => {
                            show_numberDensity = true
                        }}>Open number density modal</button
                    >
                    <button
                        class="button is-link"
                        on:click={() => {
                            show_fileConfigs = true
                        }}>Show file configs</button
                    >
                </Panel>

                <RateInitialise
                    loaded={params_found}
                    {totalMassKey}
                    bind:useParamsFile
                    bind:nameOfReactants
                    bind:legends
                    {computeOtherParameters}
                >
                    <svelte:fragment slot="basic-infos">
                        <div class="align v-center">
                            <TextSwitch
                                max={maxTimeIndex}
                                bind:value={timestartIndexScan}
                                label="Time Index"
                                on:change={() => {
                                    sliceData(true)
                                }}
                            />
                            <Textfield bind:value={molecule} label="Molecule" />
                            <Textfield bind:value={tag} label="tag" />

                            <FileReadAndLoad
                                style="justify-content: flex-end;"
                                bind:filename={$kinetics_params_file}
                                options_filter=".params.json"
                                custom_load_save_fuctions={{
                                    save: updateParamsFile,
                                    load: computeOtherParameters,
                                }}
                                {...{
                                    configDir,
                                    selectedFile,
                                    tagFile,
                                    useTaggedFile,
                                    useParamsFile,
                                }}
                            />
                        </div>
                    </svelte:fragment>
                    <svelte:fragment slot="rate-constants">
                        <RateConstants
                            {configDir}
                            bind:defaultInitialValues
                            bind:initialValues
                            bind:kinetics_fitfile={$fit_config_filename}
                        />
                    </svelte:fragment>
                </RateInitialise>

                <KlossChannels
                    bind:load_data={load_data_loss_channels}
                    bind:loss_channels
                    {nameOfReactants}
                    bind:rateConstantMode
                    {...{
                        selectedFile,
                        useTaggedFile,
                        tagFile,
                        configDir,
                        useParamsFile,
                    }}
                />
            </Accordion>
            <KineticEditor
                {...{
                    nameOfReactants,
                    loss_channels,
                    selectedFile,
                    rateConstantMode,
                }}
                bind:location={$currentLocation}
                bind:savefilename={kineticEditorFilename}
                bind:reportSaved
                bind:reportRead
            />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="left_footer_content__slot">
        <Checkbox on:change={async () => await computeParameters()} bind:value={useParamsFile} label="useParams" />
        <Checkbox bind:value={useTaggedFile} label="useTag" />
        <TextAndSelectOptsToggler
            tooltip_dir="top"
            bind:value={tagFile}
            options={tagOptions}
            label="tag files"
            update={() => computeOtherParameters()}
            on:change={computeOtherParameters}
        />
    </svelte:fragment>

    <svelte:fragment slot="footer_content__slot">
        <Select bind:value={selectedFile} label="Filename" options={fileCollections} />
        <button class="button is-link" on:click={async () => await computeParameters()}>compute</button>
        <button class="i-mdi-settings text-2xl" on:click={() => (kinetic_plot_adjust_dialog_active = true)} />
        <ButtonBadge id="kinetic-submit-button" on:click={kineticSimulation} />
    </svelte:fragment>
</LayoutDiv>

<style lang="scss">
    .main_container__div {
        display: grid;
        grid-row-gap: 1em;
        padding-right: 1em;
    }

    .parm_save__div {
        align-items: center;
        justify-content: flex-end;
        display: flex;
        gap: 1em;
        margin-left: auto;
    }
</style>
