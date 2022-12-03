<script lang="ts">
    import { activateChangelog } from '$src/js/functions'
    import SModal from '$components/modal/SModal.svelte'
    import SvelteMarkdown from 'svelte-markdown'
    import { onMount } from 'svelte'
    import { fs, path } from '@tauri-apps/api'
    
    let source: string
    $: if (import.meta.env.DEV && $activateChangelog) {
        readChangelog()
    }

    const readChangelog = async () => {
        const changelogFile = await path.resolve('./resources/CHANGELOG.md')
        console.log(changelogFile)
        const fileRead = await fs.readTextFile(changelogFile)
        if (isError(fileRead)) return window.handleError(fileRead)
        source = fileRead
    }
    onMount(readChangelog)
</script>

{#if $activateChangelog}
    <SModal
        bind:active={$activateChangelog}
        id="changelog"
        class="changelog__container"
        title="FELion GUI Changelog"
        content$style="user-select:text;"
    >
        <svelte:fragment slot="content">
            <SvelteMarkdown {source} />
        </svelte:fragment>
    </SModal>
{/if}
