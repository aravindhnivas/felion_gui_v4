<script lang="ts">
    import { Textfield } from '$src/components'
    import Panel from '$src/components/Panel.svelte'
    // import type { MassKey } from 'types/types'
    import { tick } from 'svelte'
    export let legends = ''
    export let useParamsFile = false
    export let loaded = false
    export let nameOfReactants = ''
    export let totalMassKey: Timescan.MassKey[] = []
    export let computeOtherParameters = (_?: boolean): void => {}
</script>

<Panel label="Labels" style="display: flex; flex-direction: column; gap: 1em;" {loaded}>
    <slot name="basic-infos" />
    <div class="flex justify-center w-full">
        <Textfield style="width: 30%;" bind:value={nameOfReactants} label="nameOfReactants" />
        <div style="width: 30%;" aria-label="plot-legend labels" data-cooltipz-dir="top">
            <Textfield style="width: 100%;" bind:value={legends} label="legends" />
        </div>
    </div>

    <div class="align h-center">
        {#each totalMassKey as { mass, id, included } (id)}
            <span class="tag is-warning" class:is-danger={!included}>
                {mass}
                <button
                    class="delete is-small"
                    on:click={async () => {
                        useParamsFile = false
                        included = !included
                        await tick()
                        computeOtherParameters()
                        await tick()
                    }}
                />
            </span>
        {/each}
    </div>
    {#if totalMassKey.filter((m) => m.included).length < 2}
        <span class="tag is-danger"> atleast two reactants are required for kinetics </span>
    {/if}
    <slot name="rate-constants" />
</Panel>
