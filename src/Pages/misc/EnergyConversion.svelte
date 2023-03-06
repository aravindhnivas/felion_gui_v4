<script>
    import { Textfield } from '$src/components'
    import { boltzmanConstant, PlanksConstant, electricCharge, SpeedOfLight } from '$src/js/constants'

    const fixedDigit = persistentWritable('energyConversion_fixedDigit', 2)

    $: hz = (1e12).toExponential($fixedDigit)
    $: eV = Number((PlanksConstant / electricCharge) * Number(hz)).toExponential($fixedDigit)
    $: kelvin = Number((PlanksConstant / boltzmanConstant) * Number(hz)).toFixed($fixedDigit)

    $: cm_1 = Number(Number(hz) / (SpeedOfLight * 1e2)).toFixed($fixedDigit)
    $: um = Number((SpeedOfLight / Number(hz)) * 1e6).toFixed($fixedDigit)
    $: ghz = Number(Number(hz) * 1e-9).toFixed($fixedDigit)
    $: nm = Number((SpeedOfLight / Number(hz)) * 1e9).toExponential($fixedDigit)
    $: J = Number(PlanksConstant * Number(hz)).toExponential($fixedDigit)
</script>

<div class="box">
    <div class="align">
        <h2>Energy Conversion</h2>
        <hr />
    </div>
    <div class="scroll">
        <div class="align">
            <Textfield bind:value={hz} label="Hz" />
            <Textfield
                bind:value={ghz}
                on:change={() => (hz = Number(Number(ghz) * 1e9).toExponential($fixedDigit))}
                label="GHz"
            />
            <Textfield
                bind:value={um}
                on:change={() => (hz = Number((SpeedOfLight / Number(um)) * 1e6).toExponential($fixedDigit))}
                label="Micron"
            />
            <Textfield
                bind:value={cm_1}
                on:change={() => (hz = Number(Number(cm_1) * SpeedOfLight * 1e2).toExponential($fixedDigit))}
                label="cm-1"
            />
            <Textfield
                bind:value={kelvin}
                on:change={() =>
                    (hz = Number((boltzmanConstant / PlanksConstant) * Number(kelvin)).toExponential($fixedDigit))}
                label="Kelvin"
            />
            <Textfield
                bind:value={eV}
                on:change={() =>
                    (hz = Number((electricCharge / PlanksConstant) * Number(eV)).toExponential($fixedDigit))}
                label="eV"
            />
            <Textfield
                bind:value={J}
                on:change={() => (hz = Number(Number(J) / PlanksConstant).toExponential($fixedDigit))}
                label="Joule"
            />

            <Textfield
                bind:value={nm}
                on:change={() => (hz = Number((SpeedOfLight / Number(nm)) * 1e9).toExponential($fixedDigit))}
                label="nm"
            />
        </div>

        <hr />
        <Textfield bind:value={$fixedDigit} input$type="number" label="decimal significant digit(s)" />

        <div class="align subtitle is-pulled-left mt-5">Fundamental constants</div>
        <div class="align">
            <Textfield disabled value={SpeedOfLight} label="Speed of light in vaccum (m/s)" />
            <Textfield disabled value={boltzmanConstant} label="Boltzmann constant (J/K)" />
            <Textfield disabled value={PlanksConstant} label="Plank's constant (J.s)" />
            <Textfield disabled value={electricCharge} label="Electric charge (C)" />
        </div>
    </div>
</div>

<style lang="scss">
    .box {
        display: grid;
        height: 100%;
        grid-template-rows: auto 1fr;
        overflow: hidden;
    }
    .scroll {
        overflow-y: auto;
        height: 100%;
    }
</style>
