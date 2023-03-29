<script lang="ts">
    import { DB, fields, DBlocation, delete_from_db, status } from './stores'
    import { Textfield, SegBtn, Checkbox, VirtualCheckList } from '$src/components'
    // import Slider from '@smui/slider'
    import { plot } from '$src/js/functions'
    import { readMassFile } from '../../mass'
    export let active = false

    let choices = [...fields.required, ...fields.optional].map((key) => {
        if (key.includes('precursor')) return { name: key, selected: true }
        return { name: key, selected: false }
    })

    let search_fields = {}

    const update_search_field = (choices) => {
        for (const choice of choices) {
            if (choice.selected) {
                search_fields[choice.name] ||= ''
            } else {
                delete search_fields[choice.name]
            }
        }
    }

    onMount(() => {
        update_search_field(choices)
        if (import.meta.env.PROD) $sqlMode = false
    })

    interface MASSDBRowType {
        filename: string
        temperature: string
        precursor: string
        pressure: string
        IE: string
        source: string
        keywords: string
        notes: string
    }

    let found_lists: MASSDBRowType[] = []

    $: current_filelist = found_lists?.find((row) => row.filename === markedFile) || {}
    $: fileOpts = found_lists.map((row) => ({ name: row.filename, id: window.getID() })) || []

    const searchQuery = async (defaultCMD: string = null) => {
        if ($status !== 'connected') return window.createToast('Database not connected.', 'danger')
        found_lists = []

        if (defaultCMD) {
            const [err, rows] = await oO<MASSDBRowType[], string>($DB.select(defaultCMD))
            if (err) return window.createToast(err, 'danger')
            found_lists = rows
            if (found_lists.length > 0) markedFile = found_lists[0].filename
            return console.log(found_lists)
        }

        let command = 'SELECT * from massfiles WHERE'
        const substr = $exact_match ? '' : '%'
        Object.keys(search_fields).forEach((key, ind) => {
            if (search_fields[key]) {
                command += ` ${key} ${$exact_match ? '=' : 'LIKE'} '${substr}${search_fields[key]}${substr}'`
                if (ind < Object.keys(search_fields).length - 1) command += ' AND'
            }
        })

        if (set_range) {
            if (range_min) command += ` AND mzfrom >= ${range_min}`
            if (range_max) command += ` AND mzto <= ${range_max}`
        }

        const [err, rows] = await oO<MASSDBRowType[], string>($DB.select(command))
        if (err) return window.createToast(err, 'danger')

        if (rows.length === 0) return window.createToast('No results found.', 'danger')
        found_lists = rows
        if (found_lists.length > 0) markedFile = found_lists[0].filename
        window.createToast('Query completed. Found ' + found_lists.length + ' results.', 'success')
        await tick()
        searchDiv?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }

    const plotID = 'masspec-db-plot'
    const sqlMode = persistentWritable('search_sql_mode', false)
    const SQLcommand = persistentWritable('SQLcommand', "SELECT * from massfiles WHERE source LIKE '%storage%'")
    const exact_match = persistentWritable('exact_match_masspec_db', false)

    const plotMasspec = async () => {
        const massfile = await Promise.all(fileChecked.map(async (f) => await path.join($DBlocation, 'massfiles', f)))
        const dataFromPython = await readMassFile(massfile)
        if (dataFromPython === null) return
        plot('Masspectrum', 'Mass [u]', 'Counts', dataFromPython, plotID, logScale)

        window.createToast('Plotting completed.', 'success')
        await tick()
        searchDiv?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }

    let fileChecked = []
    $: fileSelected = fileChecked
    let markedFile = ''

    let logScale = true
    const linearlogCheck = () => {
        const plotHTML = document.getElementById(plotID)
        if (!plotHTML) return
        const layout: Partial<Plotly.Layout> = {
            yaxis: { title: 'Counts', type: logScale ? 'log' : undefined },
        }
        if (plotHTML?.data) relayout(plotID, layout)
    }
    let searchDiv: HTMLDivElement
    let set_range = false
    let [range_min, range_max] = ['0', '']
</script>

<div bind:this={searchDiv} class:hide={!active} class="main__div p-2" style="overflow: auto;">
    <span>Select fields to include in search</span>
    <SegBtn {choices} style="width: 100%;" on:selected={(e) => update_search_field(e.detail)} />

    <div class="align border-solid border-1 rounded-xl p-5">
        <span>Enter search keywords on selected fields</span>
        <Checkbox class="align" bind:value={$exact_match} label="match exact word(s)" />

        <div
            class="align"
            on:keyup={async (e) => {
                if (e.key !== 'Enter') return
                await searchQuery()
            }}
        >
            {#each Object.keys(search_fields) as label (label)}
                <Textfield label={`Enter ${label}`} bind:value={search_fields[label]} variant="outlined" />
            {/each}
        </div>

        <div class="align">
            <Checkbox bind:value={set_range} label="set m/z range" />
            {#if set_range}
                <Textfield style="width: 5em;" label="min" bind:value={range_min} />
                <Textfield style="width: 5em;" label="max" bind:value={range_max} />
            {/if}
        </div>

        <button
            class="button is-link ml-auto"
            on:click={async ({ currentTarget }) => {
                toggle_loading(currentTarget)
                await searchQuery()
                toggle_loading(currentTarget)
            }}>Submit</button
        >
    </div>
    {#if found_lists.length}
        <div class="align box my-5 border-solid border-1">
            <div class="align">
                <h3>Search results</h3>
                <h3>: found {found_lists.length} files</h3>
                <span><kbd>Ctrl</kbd> + <kbd>left-click</kbd> on filename to mark and view file info</span>

                <Checkbox
                    aria-label={'SQL SELECT commands'}
                    data-cooltipz-dir={'left'}
                    class="ml-auto"
                    bind:value={$sqlMode}
                    label="SQL command mode"
                />
                {#if markedFile}
                    <button
                        class="button is-danger"
                        on:click={async () => {
                            await delete_from_db(markedFile)

                            fileChecked = fileChecked.filter((f) => f !== markedFile)
                            await searchQuery()
                        }}
                    >
                        Delete marked file from database
                    </button>
                {/if}
            </div>

            {#if $sqlMode}
                <Textfield
                    style="width: 100%;"
                    label="Sqlite3 query"
                    bind:value={$SQLcommand}
                    on:keyup={async (e) => {
                        if (e.key !== 'Enter') return
                        const value = e.target.value
                        await searchQuery(value)
                    }}
                />
            {/if}

            {#if found_lists.length}
                <div class="output__main__div">
                    <div class="left">
                        <VirtualCheckList
                            on:fileselect
                            bind:fileChecked
                            items={fileOpts}
                            {fileSelected}
                            markfiletype="mass"
                            bind:markedFile
                        />
                        <button
                            class="button is-link mt-5"
                            on:click={async ({ currentTarget }) => {
                                if (!fileChecked.length) return window.createToast('No files selected', 'danger')
                                toggle_loading(currentTarget)
                                await oO(plotMasspec())
                                toggle_loading(currentTarget)
                            }}>Plot selected files</button
                        >
                    </div>

                    <div>
                        {#each Object.keys(current_filelist) as label (label)}
                            <div class="mr-2">{label}:</div>
                        {/each}
                    </div>
                    <div>
                        {#each Object.keys(current_filelist) as label (label)}
                            <div>{current_filelist[label] || '-'}</div>
                        {/each}
                    </div>
                </div>
            {:else}
                <div class="output__main__div">
                    <span>No results</span>
                </div>
            {/if}
        </div>

        {#if fileChecked.length}
            <Checkbox bind:value={logScale} label="log scale" on:change={linearlogCheck} />
            <div class="graph_div" id={plotID} />
        {/if}
    {/if}
</div>

<style lang="scss">
    .main__div {
        gap: 0.5em;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        .slider__div {
            width: 500px;
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
        }

        .output__main__div {
            width: 100%;
            display: grid;
            gap: 0.5em;
            grid-auto-flow: column;
            grid-template-columns: auto auto 1fr;
            .left {
                display: flex;
                overflow: auto;
                max-height: 300px;
                padding-right: 2em;
                flex-direction: column;
                border-right: solid 1px white;
            }
        }

        .graph_div {
            width: 100%;
            height: 100%;
        }
    }
</style>
