<script lang="ts">
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'
    import { orderBy, uniqBy } from 'lodash-es'
    import { FileReadAndLoad } from '$src/components'
    export let idKey: string = 'id'
    export let rowKeys: string[]
    export let rows = []
    export let headKeys: string[] = null
    export let closeableRows = false
    export let includeIndex = true

    export let editable = false
    export let sortable = false
    export let configDir: string = null
    export let options_filter: string = '.json'
    export let filename: string = 'data'
    export let maxHeight: string = '25em'
    export let fileReadProps = {}

    let mounted = false
    onMount(() => {
        if (!headKeys && rowKeys) {
            headKeys = rowKeys
        }

        if (rows.length > 0) {
            rows = uniqBy(rows, idKey)

            if (!rowKeys) {
                rowKeys = Object.keys(rows[0])
            }
            if (!headKeys) {
                headKeys = Object.keys(rows[0])
            }
        }
        mounted = true

        // if (!filename.endsWith(options_filter)) {
        //     filename = `${filename}${options_filter}`
        // }
    })

    let sortToggle: { [key: string]: boolean } = {}
    rowKeys.forEach((key: string) => (sortToggle[key] = false))

    const sortTable = (key: string) => {
        if (!sortable) return
        rows = orderBy(rows, key, sortToggle[key] ? 'asc' : 'desc')
    }

    const dispatch = createEventDispatcher()
</script>

{#if mounted}
    <div class="align">
        {#if configDir}
            <FileReadAndLoad
                style="justify-content: flex-end;"
                bind:dataToSave={rows}
                {configDir}
                singleFilemode={true}
                {options_filter}
                bind:filename
                {...fileReadProps}
            />
        {/if}
        <DataTable table$class="pr-5" style="width: 100%; max-height: {maxHeight}">
            <Head>
                <Row>
                    {#if includeIndex}
                        <Cell style="width: 4em;"># {rows.length}</Cell>
                    {/if}
                    {#each headKeys as key, i (key)}
                        <Cell on:click={() => sortTable(rowKeys[i])}>
                            <!-- <Cell> -->
                            <div class="header_cell">
                                <span>{key}</span>
                                {#if sortable}
                                    <button
                                        class={sortToggle[rowKeys[i]] ? 'i-mdi-arrow-upward' : 'i-mdi-arrow-downward'}
                                        on:click={() => (sortToggle[rowKeys[i]] = !sortToggle[rowKeys[i]])}
                                    />
                                {/if}
                            </div>
                        </Cell>
                    {/each}
                    {#if closeableRows}
                        <Cell style="width: 7em;"
                            ><button
                                class="button is-link"
                                style="background-color: var(--color-danger);"
                                on:click={() => {
                                    if (rows.length === 0) return window.createToast('Table is empty', 'warning')
                                    rows = []
                                    window.createToast('Table cleared', 'warning')
                                    dispatch('tableCleared')
                                }}>Clear</button
                            ></Cell
                        >
                    {/if}
                </Row>
            </Head>

            <Body>
                {#each rows as row, index (row[idKey])}
                    <Row>
                        {#if includeIndex}
                            <Cell>{index + 1}</Cell>
                        {/if}
                        {#each rowKeys as key (key)}
                            {#if typeof row[key] === 'object'}
                                <Cell style={row[key]?.style} on:click={row[key]?.cb}>{row[key]?.name}</Cell>
                            {:else}
                                <Cell>
                                    {#if editable}
                                        <input type="text" bind:value={row[key]} style="color: black; width: 100%;" />
                                    {:else}
                                        <span style="user-select:text; color: black;">{row[key]}</span>
                                    {/if}
                                </Cell>
                            {/if}
                        {/each}
                        {#if closeableRows}
                            <Cell>
                                <button
                                    class="i-mdi-close bg-red"
                                    on:click={() => {
                                        rows = rows.filter((r) => r[idKey] !== row[idKey])
                                    }}
                                />
                            </Cell>
                        {/if}
                    </Row>
                {/each}
            </Body>
        </DataTable>
    </div>
{/if}

<style>
    .header_cell {
        display: flex;
        border-radius: 0.5em;
        padding: 0.1em;
        align-items: center;
        justify-content: center;
        background-color: #5a419b;
    }
</style>
