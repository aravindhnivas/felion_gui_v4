<script>
    import { Textfield } from '$src/components'
    import { boltzmanConstant, PlanksConstant, electricCharge, SpeedOfLight } from '$src/js/constants'

    let fixedDigit = 3

    $: hz = Number((1e12).toExponential(fixedDigit))
    $: eV = Number((PlanksConstant / electricCharge) * hz).toFixed(fixedDigit)
    $: kelvin = Number((PlanksConstant / boltzmanConstant) * hz).toFixed(fixedDigit)

    $: cm_1 = Number(hz / (SpeedOfLight * 1e2)).toFixed(fixedDigit)
    $: um = Number((SpeedOfLight / hz) * 1e6).toFixed(fixedDigit)
    $: ghz = Number(hz * 1e-9).toFixed(fixedDigit)
    $: nm = Number((SpeedOfLight / hz) * 1e9).toFixed(fixedDigit)
    $: J = Number(PlanksConstant * hz).toExponential(fixedDigit)
</script>

<div class="box">
    <div class="align">
        <h2>Energy Conversion</h2>
        <hr />
    </div>
    <div class="scroll">
        <div class="align">
            <Textfield bind:value={hz} label="Hz" />
            <Textfield bind:value={ghz} on:change={() => (hz = Number(ghz) * 1e9)} label="GHz" />
            <Textfield bind:value={um} on:change={() => (hz = (SpeedOfLight / Number(um)) * 1e6)} label="Micron" />
            <Textfield bind:value={cm_1} on:change={() => (hz = Number(cm_1) * SpeedOfLight * 1e2)} label="cm-1" />
            <Textfield
                bind:value={kelvin}
                on:change={() => (hz = (boltzmanConstant / PlanksConstant) * Number(kelvin))}
                label="Kelvin"
            />
            <Textfield
                bind:value={eV}
                on:change={() => (hz = (electricCharge / PlanksConstant) * Number(eV))}
                label="eV"
            />
            <Textfield bind:value={J} on:change={() => (hz = Number(J) / PlanksConstant)} label="Joule" />

            <Textfield bind:value={nm} on:change={() => (hz = (SpeedOfLight / Number(nm)) * 1e9)} label="nm" />
        </div>

        <hr />
        <Textfield bind:value={fixedDigit} input$type="number" label="decimal significant digit(s)" />

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
