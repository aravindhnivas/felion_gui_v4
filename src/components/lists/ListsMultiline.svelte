<script lang="ts">
    import List, { Item, Text, PrimaryText, SecondaryText } from '@smui/list'

    export let lists: { primary: string; secondary: string[]; id: string; html?: boolean; link?: string }[] = []
    export let twoLine = true
    export let nonInteractive = true
    onMount(() => {
        console.warn('Credits mounted')
    })
</script>

<List {twoLine} {nonInteractive} threeLine={!twoLine}>
    {#each lists as list (list.id)}
        <Item>
            <Text>
                <PrimaryText>
                    {list.primary}
                    <button
                        style="cursor: pointer;"
                        class="i-mdi-open-in-new"
                        on:click={async () => {
                            if (!list?.link) return window.createToast('Inavlid URL', 'warning')
                            await shell.open(list.link)
                        }}
                    />
                </PrimaryText>
                {#each list.secondary as item}
                    {#if list.html}
                        <SecondaryText style="user-select: text;">{@html item}</SecondaryText>
                    {:else}
                        <SecondaryText style="user-select: text;">{item}</SecondaryText>
                    {/if}
                {/each}
            </Text>
        </Item>
    {/each}
</List>
