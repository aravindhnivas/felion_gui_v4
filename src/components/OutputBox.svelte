<script lang="ts">
    import VirtualList from '@sveltejs/svelte-virtual-list'

    export let output: OutputBoxtype[] = []
    export let heading: string = ''
    export let style: string = ''
    export let testMode: boolean = false

    let className: string = ''
    export { className as class }
</script>

<div class="main__div box {className}" {style}>
    <div class="align">
        <div class="mr-auto">{heading.toUpperCase()}</div>

        <div class="ml-auto">
            {#if testMode}
                <button
                    class="button is-link ml-auto"
                    on:click={(e) => {
                        console.log('adding to output')
                        const value = 'Testing\nNew line\n\tTabbed line'
                        if (e.ctrlKey) {
                            output = [...Array(5).fill({ value, type: 'warning' }), ...output]
                        }
                        output = [{ value, type: 'warning' }, ...output]
                        console.log(output)
                    }}>Test</button
                >
            {/if}

            <button
                class="button is-danger"
                on:click={() => {
                    output = []
                }}>Clear</button
            >
        </div>
    </div>

    <hr style="width: 100%;" />

    <div class="console-box">
        <VirtualList height="100vh" items={output} let:item>
            {#each item.value.split('\n') as val}
                <span class="has-text-{item.type}" style="width: 100%;">>> {val}</span>
                <br />
            {/each}
        </VirtualList>
    </div>
</div>

<style>
    .main__div {
        display: grid;
        grid-template-rows: auto auto 1fr;
        height: 100%;
        width: 100%;
        overflow: hidden;
    }
    .console-box {
        display: flex;
        overflow: auto;
        user-select: text;
        white-space: pre-wrap;
        align-items: baseline;
        flex-direction: column;
        gap: 0.5em;
    }
</style>
