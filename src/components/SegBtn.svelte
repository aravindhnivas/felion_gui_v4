<script lang="ts">
    import SegmentedButton, { Segment, Label } from '@smui/segmented-button'
    export let choices: { name: string; selected: boolean }[] = []
    export let style = ''
    export let label = 'select items'
    let className = ''
    export { className as class }
    const dispatch = createEventDispatcher()
</script>

<div class="container__div {className}" {style}>
    <div class="text-sm">{label}</div>
    <SegmentedButton bind:segments={choices} let:segment key={(segment) => segment.name}>
        <Segment
            {segment}
            selected={segment.selected}
            on:click={() => {
                segment.selected = !segment.selected
                choices = choices // Remember to do this so Svelte knows that `choices` has changed.
                dispatch('selected', choices)
            }}
        >
            <Label>{segment.name}</Label>
        </Segment>
    </SegmentedButton>
</div>

<style>
    .container__div {
        display: flex;
        flex-direction: column;
    }
</style>
