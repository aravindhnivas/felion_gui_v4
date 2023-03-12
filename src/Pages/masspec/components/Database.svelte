<script lang="ts">
    import { save_to_db, status, DB, clear_db } from './db/stores'
    import { SeparateWindow } from '$src/components'
    import { EntryMode, SearchMode, Header } from './db/'
    // import Database from 'tauri-plugin-sql-api'

    export let DB_active = false
    export let file_location = ''
    export let filenames: string[] = []

    // let DB = writable<Database | null>(null)
    const searchMode = persistentWritable('masspec-db-searchMode', false)

    onMount(async () => {
        if (DB_active && $status === 'disconnected') return status.connect()
    })

    onDestroy(async () => {
        if (!$DB) return
        await $DB.close()
    })

    $: if (DB_active) {
        if ($status === 'connected') status.check()
        if ($status === 'disconnected') status.connect()
        console.log('DB window activated', { $DB })
        if ($DB) window.createToast('Database connected.', 'success')
    }
</script>

<!-- {#if DB_active} -->
<SeparateWindow
    bind:active={DB_active}
    title="Database"
    graphMode={false}
    on:close={async () => {
        console.warn('Closing event for masspec DB')
        if (!$DB) return
        await $DB.close()
        $DB = null
        console.warn('masspec database closed')
        console.log({ $DB })
    }}
>
    <svelte:fragment slot="header_content__slot">
        <Header />
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <EntryMode active={!$searchMode} {filenames} />
        <SearchMode active={$searchMode} />
    </svelte:fragment>

    <svelte:fragment slot="left_footer_content__slot">
        <button class="button is-link" on:click={() => ($searchMode = !$searchMode)}>
            Toggle {$searchMode ? 'Entry mode' : 'Search mode'}
        </button>
    </svelte:fragment>
    <svelte:fragment slot="footer_content__slot">
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
    </svelte:fragment>
</SeparateWindow>
<!-- {/if} -->
