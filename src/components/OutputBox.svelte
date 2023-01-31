<script lang="ts">
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
                        if (e.ctrlKey) {
                            output = [...Array(5).fill({ value: 'Testing', type: 'warning' }), ...output]
                            return
                        }
                        output = [{ value: 'Testing', type: 'warning' }, ...output]
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
        {#each output as info}
            {#if info.value}
                <span class="has-text-{info.type}" style="width: 100%;">>> {info.value}</span>
            {/if}
        {/each}
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
