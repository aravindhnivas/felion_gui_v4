<script lang="ts">
    import { activateChangelog } from '$src/js/functions'
    import { SModal } from '$src/components'
    import SvelteMarkdown from 'svelte-markdown'

    let source: string

    $: if (import.meta.env.DEV && $activateChangelog) {
        readChangelog()
    }

    const readChangelog = async () => {
        source = ''
        const changelogFile = await path.resolveResource("resources/CHANGELOG.md")

        const [_err, fileRead] = await oO(fs.readTextFile(changelogFile))
        if (_err) return window.handleError(_err)

        source = fileRead
    }
    onMount(readChangelog)
</script>

{#if $activateChangelog && source}
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
