<script lang="ts">
    import { save_to_db, status } from './db/stores'
    import { SeparateWindow } from '$src/components'
    import { EntryMode, SearchMode, Header } from './db/'

    export let DB_active = false
    export let file_location = ''
    export let filenames: string[] = []
    let searchMode = false
    onMount(() => {
        if ($status !== 'connected') status.submit()
    })
</script>

<SeparateWindow bind:active={DB_active} title="Database" graphMode={false} maximize={false}>
    <svelte:fragment slot="header_content__slot">
        <Header />
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <EntryMode active={!searchMode} {filenames} />
        <SearchMode active={searchMode} />
    </svelte:fragment>

    <svelte:fragment slot="left_footer_content__slot">
        <button class="button is-link" on:click={() => (searchMode = !searchMode)}>
            Toggle {searchMode ? 'Entry mode' : 'Search mode'}
        </button>
    </svelte:fragment>
    <svelte:fragment slot="footer_content__slot">
        <button
            class="button is-link"
            on:click={async ({ currentTarget }) => {
                toggle_loading(currentTarget)
                await save_to_db(file_location)
                toggle_loading(currentTarget)
            }}
        >
            <span>Save</span>
            <i class="i-mdi-database-arrow-down text-xs" />
        </button>
    </svelte:fragment>
</SeparateWindow>
