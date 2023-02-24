<script lang="ts">
    import {
        tube_diameter,
        room_temperature,
        number_density_std,
        TakaishiSensuiConstants,
        calibration_factor as C_factor
    } from '$src/Pages/misc/numberDensity/utils'
    import {compute_number_density} from '$src/Pages/misc/numberDensity/'
    import { Textfield, Switch } from '$src/components';

    let includeTranspiration = true
    
    let X: string = ''
    let F: string = ''
    let srgMode = false;
    let added_pressure: string | number = "5e-6"
    let trap_temperature: string | number = 4.7
    let background_pressure: string | number = "1e-8"
    let calibration_factor: string | number = $C_factor
    let numberDensity: {nHe: string, nHe_transpiration: string} = null


    export const computeNumberDensity = async (e?: Event, get_data=false) => {
        numberDensity = null
        
        const args = {
            srgMode,
            added_pressure,
            trap_temperature,
            background_pressure,
            calibration_factor,
        }

        const [_err, datafromPython] = await oO(compute_number_density(e, args))

        if(_err || !datafromPython) return Promise.reject('Computation failed')
        ;({numberDensity, X, F} = datafromPython)

        dispatch_current_numberdensity()
        if(get_data) return Promise.resolve(structuredClone({...args, ...datafromPython }))
        return Promise.resolve(dispatch_current_numberdensity(structuredClone({...args, ...datafromPython })))
    }


    const dispatch = createEventDispatcher();
    const dispatch_current_numberdensity = (data=null) => {
        const {nHe, nHe_transpiration} = numberDensity
        dispatch('getValue', {nHe: includeTranspiration ? nHe_transpiration : nHe })
        if(data) dispatch('fullargs', {data})
    }

</script>

<div class="align h-center">

    <slot name="header" />
    
    <Switch on:change={async ()=>{
        return await computeNumberDensity()
    }}
        tooltip="Spinning Rotor Gauge"
        bind:selected={srgMode}
        label="SRG"
    />
    
    <Switch on:change={dispatch_current_numberdensity}
        tooltip="correct for thermal-transpiration"
        bind:selected={includeTranspiration}
        label="TT"
    />
    <button class="button is-link" on:click={computeNumberDensity}>Compute</button>
</div>

<div class="align scroll mt-2 pb-5" on:keypress="{async (e)=>{
    if(e.key==="Enter") {
        await computeNumberDensity()
    }
}}">

    <div style="display: flex; flex-direction: column; padding: 0 1em;">
        
        <div class="align h-center">

            <div class="border__div">
                <Textfield
                    bind:value={trap_temperature}
                    label={'trap_temperature [K]'}
                />
                <Textfield
                    bind:value={$number_density_std.trap_temperature}
                    label="std. dev."
                />
            </div>
            <div class="border__div">
                <Textfield
                    bind:value={background_pressure}
                    label={'background_pressure [mbar]'}
                />
                <Textfield
                    bind:value={$number_density_std.background_pressure}
                    label="std. dev. (%)"
                />
            </div>
            <div class="border__div">
                <Textfield
                    bind:value={added_pressure}
                    label={'added_pressure [mbar]'}
                />
                <Textfield
                    bind:value={$number_density_std.added_pressure}
                    label="std. dev. (%)"
                />
            </div>
        </div>
        
    </div>

    <div style="display: flex; flex-direction: column; padding: 0 1em;">
        
        <div class="align h-center">

            <div class="border__div">
                <Textfield disabled={srgMode}
                    bind:value={calibration_factor}
                    label="Calibration Factor"
                />

                <Textfield disabled={srgMode}
                    bind:value={$number_density_std.calibration_factor}
                    label="std.dev."
                />
            </div>

            <div class="border__div">

                <Textfield
                    bind:value={$room_temperature}
                    label="Room temperature (K)"
                />

                <Textfield
                    bind:value={$number_density_std.room_temperature}
                    label="std.dev."
                />
            </div>
        </div>
        <div class="align h-center constants">
            <h2 class="m-0 mt-5" style:width='100%' >Modified Takaishi-Sensui constants (for He gas at 4.3 K)</h2>
            <div>(Reference: J. Chem. Phys. 113, 1738 (2000); https://doi.org/10.1063/1.481976)</div>
            <br>
            
            <div class="border__div">
                {#each Object.keys($TakaishiSensuiConstants) as key (key)}
                    
                <div class='align h-center'>

                    <Textfield style='width: 7em;'
                        bind:value={$TakaishiSensuiConstants[key].value[0]}
                        label={`${key} [${$TakaishiSensuiConstants[key].unit}]`}
                        />
                    <Textfield style='width: 7em;'
                        bind:value={$TakaishiSensuiConstants[key].value[1]}
                        label="std. dev."
                        />
                </div>
                {/each}
            </div>

            <div class="border__div">
                <Textfield
                    input$min="0"
                    input$step="0.1"
                    type="number"
                    bind:value={$tube_diameter}
                    label="connecting tube diameter [mm]"
                />
                <Textfield
                    bind:value={$number_density_std.tube_diameter}
                    label="std. dev."
                />
            </div>

            <div class="border__div">

                <Textfield
                    disabled
                    value={X || ''}
                    label="X [mm.Pa / K]"
                />
                
                <Textfield
                    disabled
                    value={F || ''}
                    label="F (Degree of thermal transpiration)"
                />
            </div>
        </div>
    </div>

</div>
<style>
    .scroll {
        overflow-y: auto; height: 100%;
    }
    .border__div {
        gap: 1em;
        display: flex;

        justify-content: center;
        border: solid 1px white;
        border-radius: 1em;
        padding: 1em;
        flex-wrap: wrap;
    }
</style>
