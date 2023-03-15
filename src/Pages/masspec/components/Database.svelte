<script lang="ts">
    import { save_to_db, status, DB, clear_db } from './db/stores'
    import { SeparateWindow } from '$src/components'
    import { EntryMode, SearchMode, Header } from './db/'
    export let DB_active = false
    export let file_location = ''
    export let filenames: string[] = []

    let searchMode = true
    onMount(async () => {
        if (DB_active && $status === 'disconnected') status.connect()
    })

    onDestroy(async () => {
        if (!$DB) return
        await $DB.close()
    })

    const update_db_status = () => {
        if ($status === 'connected') status.check()
        if ($status === 'disconnected') status.connect()
    }
    $: if (DB_active) update_db_status()
</script>

<SeparateWindow
    bind:active={DB_active}
    title="Database"
    graphMode={false}
    on:close={async () => {
        if (!$DB) return
        await $DB.close()
        $DB = null
    }}
>
    <svelte:fragment slot="header_content__slot">
        <Header />
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        {#if $status === 'connected'}
            <EntryMode active={!searchMode} {filenames} />
            <SearchMode active={searchMode} />
        {/if}
    </svelte:fragment>

    <svelte:fragment slot="left_footer_content__slot">
        {#if $status === 'connected'}
            <button class="button is-link" on:click={() => (searchMode = !searchMode)}>
                Switch to {searchMode ? 'Entry mode' : 'Search mode'}
            </button>
        {/if}
    </svelte:fragment>
    <svelte:fragment slot="footer_content__slot">
        {#if $status === 'connected'}
            {#if import.meta.env.DEV}
                <button class="button is-danger" on:click={clear_db}> Clear database </button>
            {/if}

            <button
                class="button is-link"
                on:click={async ({ currentTarget }) => {
                    toggle_loading(currentTarget)
                    await save_to_db(file_location)
                    toggle_loading(currentTarget)
                }}
            >
                Save
            </button>
        {/if}
    </svelte:fragment>
</SeparateWindow>
<!-- {/if} -->
