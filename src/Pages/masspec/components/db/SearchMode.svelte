<script lang="ts">
    import { DB, fields, DBlocation, delete_from_db, status } from './stores'
    import { Textfield, SegBtn, Radio, Checkbox } from '$src/components'
    import { plot } from '$src/js/functions'
    import { readMassFile } from '../../mass'

    export let active = false

    let choices = [...fields.required, ...fields.optional].map((key) => {
        if (key.includes('source')) return { name: key, selected: true }
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

    let filename = ''
    let found_lists: MASSDBRowType[] = []
    $: current_filelist = found_lists?.find((row) => row.filename === filename) || {}
    $: fileOpts = found_lists.map((row) => row.filename) || []
    // $: console.log(current_filelist)
    const searchQuery = async (defaultCMD: string = null) => {
        if ($status !== 'connected') return toast.error('Database not connected.')

        found_lists = []

        if (defaultCMD) {
            const [err, rows] = await oO<MASSDBRowType[], string>($DB.select(defaultCMD))
            if (err) return toast.error(err)
            found_lists = rows
            if (found_lists.length > 0) filename = found_lists[0].filename
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
        console.warn(command)
        const [err, rows] = await oO<MASSDBRowType[], string>($DB.select(command))
        if (err) return toast.error(err)
        if (rows.length === 0) return toast.error('No results found.', { duration: 3000 })
        found_lists = rows
        if (found_lists.length > 0) filename = found_lists[0].filename
        // await plotMasspec()
        toast.success('Query completed. Found ' + found_lists.length + ' results.', { duration: 3000 })
    }
    const plotID = 'masspec-db-plot'
    const sqlMode = persistentWritable('search_sql_mode', false)
    const exact_match = persistentWritable('exact_match_masspec_db', false)

    const plotMasspec = async () => {
        const massfile = await path.join($DBlocation, 'massfiles', filename)
        const dataFromPython = await readMassFile([massfile])
        if (dataFromPython === null) return
        const logScale = true

        const { precursor, temperature, source, pressure } = current_filelist as MASSDBRowType
        const title = `${precursor} at ${temperature} K from ${source} ion source at ${pressure} mbar`
        plot(title, 'Mass [u]', 'Counts', dataFromPython, plotID, logScale)
    }
    $: if (filename && plotID) plotMasspec()
</script>

<div class:hide={!active} class="main__div p-2" style="overflow: auto;">
    <span>Select fields to include in search</span>

    <SegBtn {choices} style="width: 100%;" on:selected={(e) => update_search_field(e.detail)} />

    <div class="align border-solid border-1 rounded-xl p-5">
        <span>Enter search keywords on resp. selected fields</span>

        <Checkbox bind:value={$exact_match} label="match exact word" />

        <div
            class="align"
            on:keyup={async (e) => {
                if (e.key !== 'Enter') return
                await searchQuery()
            }}
        >
            {#each Object.keys(search_fields) as label (label)}
                <Textfield {label} bind:value={search_fields[label]} />
            {/each}

            <button
                class="button is-link ml-auto"
                on:click={async ({ currentTarget }) => {
                    toggle_loading(currentTarget)
                    await searchQuery()
                    toggle_loading(currentTarget)
                }}>Submit</button
            >

            <!-- <button class="button is-danger" on:click={clear_db}> Clear database </button> -->
        </div>
    </div>

    <div class="align box my-5 border-solid border-1">
        <div class="align">
            <h3>Search results: found {found_lists.length} files</h3>
            <Checkbox class="ml-auto" bind:value={$sqlMode} label="SQL command mode" />
            {#if filename}
                <button
                    class="button is-danger"
                    on:click={async () => {
                        await delete_from_db(filename)
                    }}
                >
                    Delete file from database
                </button>
            {/if}
        </div>

        {#if $sqlMode}
            <Textfield
                style="width: 100%;"
                label="Sqlite3 query"
                value="SELECT * from massfiles WHERE source LIKE '%storage%'"
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
                    <Radio bind:value={filename} options={fileOpts} />
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

    {#if filename}
        <div class="graph_div" id={plotID} />
    {/if}
</div>

<style lang="scss">
    .main__div {
        gap: 0.5em;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        .output__main__div {
            width: 100%;
            display: grid;
            gap: 0.5em;
            grid-auto-flow: column;
            grid-template-columns: auto auto 1fr;
            .left {
                display: flex;
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
