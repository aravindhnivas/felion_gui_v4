<script lang="ts">
    import { statusReport, showlogs } from '$src/Pages/thz/stores'
    import { ButtonBadge, Select } from '$src/components'

    export let progress = 0
    export let simulationMethod = 'Normal'
    export let simulation: (e?: Event) => Promise<void>

    const simulationMethods = ['Normal', 'FixedPopulation', 'withoutCollisionalConstants']
</script>

<!-- <button
    style="align-self:end;"
    class="button is-warning"
    on:click={() => {
        showreport = !showreport
    }}>{showreport ? 'Go back' : 'Show progress'}</button
> -->

{#if !$showlogs}
    <button
        style="align-self:end;"
        class="button is-warning"
        on:click={() => {
            $showlogs = true
        }}>Show logs</button
    >
{/if}

<div style="display: flex; gap: 1em;">
    <Select options={simulationMethods} bind:value={simulationMethod} label="simulationMethod" />
    <ButtonBadge
        style="align-self:end;"
        on:pyEventData={async (e) => {
            const { stdout } = e.detail
            const val = stdout?.trim()
            if (val) statusReport.warn(val)
            // console.warn('stdout', { val, stdout })
            if (stdout.includes('%')) {
                const percent = parseFloat(stdout.split('%')[0].trim())
                if (percent > 0) {
                    progress = percent / 100
                }
            }
        }}
        on:click={async (e) => {
            statusReport.warn('Running simulation...')
            if (!simulation) {
                console.log('simulation not set')
                return
            }
            await simulation(e)
        }}
    />
</div>
