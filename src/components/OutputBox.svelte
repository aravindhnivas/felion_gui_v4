<script lang="ts">
    export let output: OutputBoxtype[] = []
    export let heading: string = ''
    export let style: string = ''
    let className: string = ''
    export { className as class }
</script>

<div class="console-box align box {className}" {style}>
    <span class="tag">{heading}</span>
    <button
        class="button is-danger ml-auto"
        on:click={() => {
            output = []
        }}>Clear</button
    >

    <hr />
    {#each output as info (info)}
        {#if info.value}
            <span class="has-text-{info.type}" style="width: 100%;">>> {info.value}</span>
        {/if}
    {/each}
</div>

<style>
    .console-box {
        display: flex;
        align-content: flex-start;
        overflow: auto;
        user-select: text;
        white-space: pre-wrap;
        align-items: baseline;
        /* height: calc(42vh - 5rem);
        max-height: calc(42vh - 5rem); */
    }
</style>
