<script lang="ts">
    import { numberDensity } from '../stores/common'
    import { Textfield, TextSwitch, Panel } from '$src/components'

    export let attachmentCoefficients: ValueLabel[] = []
    export let k3: AttachmentRate = { constant: [], rate: [] }
    export let kCID: AttachmentRate = { constant: [], rate: [] }

    const computeAttachmentRate = async () => {
        await tick()
        k3.rate = structuredClone(k3.constant).map((rate) => ({
            ...rate,
            value: Number(Number(rate.value) * Number($numberDensity) ** 2).toFixed(3),
            id: window.getID(),
        }))

        kCID.rate = structuredClone(kCID.constant).map((rate) => ({
            ...rate,
            value: Number(+rate.value * +$numberDensity).toFixed(3),
            id: window.getID(),
        }))
        console.log('Computed attachment rates')
    }

    // $: console.warn({ $numberDensity })
    $: if ($numberDensity) {
        computeAttachmentRate()
    }
</script>

<Panel label="Rare-gas attachment (K3) and dissociation (kCID) constants" loaded={attachmentCoefficients.length > 0}>
    <div class="align h-center mb-5">
        {#each attachmentCoefficients as { label, value, id } (id)}
            <TextSwitch bind:value {label} step={0.1} />
        {/each}
    </div>

    <div class="align h-center">
        <Textfield bind:value={$numberDensity} label="numberDensity (cm-3)" />

        <button class="button is-link" on:click={computeAttachmentRate}>Compute rate constants</button>

        <div class="align h-center">
            <div class="">k3 (cm6/s):</div>
            {#each k3.constant as { label, value, id } (id)}
                <Textfield bind:value {label} />
            {/each}
        </div>

        <div class="align h-center">
            <div class="">kCID (cm3/s):</div>
            {#each kCID.constant as { label, value, id } (id)}
                <Textfield bind:value {label} />
            {/each}
        </div>

        <hr />

        <div class="align h-center">
            <div class="">k3 (per sec):</div>
            {#each k3.rate as { label, value, id } (id)}
                <Textfield bind:value {label} />
            {/each}
        </div>

        <div class="align h-center">
            <div class="">kCID (per sec):</div>
            {#each kCID.rate as { label, value, id } (id)}
                <Textfield bind:value {label} />
            {/each}
        </div>
    </div>
</Panel>
