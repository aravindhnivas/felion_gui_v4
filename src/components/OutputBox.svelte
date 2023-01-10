<script lang="ts">
    export let output: OutputBoxtype[] = []
    export let heading: string = ''
</script>

<div id="serverInfo__div" class="align box">
    <span class="tag">{heading}</span>
    <button
        class="button is-danger ml-auto"
        on:click={() => {
            output = []
        }}>Clear</button
    >

    <hr />
    {#each output as info (info)}
        <span class="has-text-{info.type}" style="width: 100%;">>> {info.value}</span>
    {/each}
</div>

<style>
    #serverInfo__div {
        display: flex;
        align-content: flex-start;
        overflow: auto;
        user-select: text;
        white-space: pre-wrap;
        align-items: baseline;
        height: calc(42vh - 5rem);
        max-height: calc(42vh - 5rem);
    }
</style>
