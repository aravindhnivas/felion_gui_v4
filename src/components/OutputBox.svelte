<script lang="ts">
    export let output: OutputBoxtype[] = []
    export let heading: string = ''
    export let style: string = ''
    export let testMode: boolean = false
    let className: string = ''
    export { className as class }
</script>

<div class="console-box align box {className}" {style}>
    <span class="tag mr-auto">{heading}</span>

    <div class="ml-auto">
        {#if testMode}
            <button
                class="button is-link ml-auto"
                on:click={() => {
                    output = [{ value: 'Testing', type: 'warning' }, ...output]
                }}>Add</button
            >
        {/if}

        <button
            class="button is-danger"
            on:click={() => {
                output = []
            }}>Clear</button
        >
    </div>
    <hr style="width: 100%;" />
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
