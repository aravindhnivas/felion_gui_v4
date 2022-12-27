<script lang="ts">
    import List, { Item, Text, PrimaryText, SecondaryText } from '@smui/list'

    export let lists: { primary: string; secondary: string[]; id: string; html?: boolean; link?: string }[] = []
    export let twoLine = true
    export let nonInteractive = true
</script>

<List {twoLine} {nonInteractive} threeLine={!twoLine}>
    {#each lists as list (list.id)}
        <Item>
            <Text>
                <PrimaryText>{list.primary}</PrimaryText>
                {#each list.secondary as item}
                    {#if list.html}
                        <SecondaryText>{@html item}</SecondaryText>
                    {:else}
                        <SecondaryText>{item}</SecondaryText>
                    {/if}
                {/each}
            </Text>
        </Item>
    {/each}
</List>
