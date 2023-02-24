import {number_density_std, room_temperature, TakaishiSensuiConstants, tube_diameter} from './utils'
import computePy_func from '$lib/pyserver/computePy'

export const compute_number_density = async (e: Event, data: NumberDensityInputType) => {
    console.log('computing number density', {data})
    const {
        srgMode,
        added_pressure,
        trap_temperature,
        background_pressure,
        calibration_factor
    } = data
    
    if(Number(trap_temperature) <= 0) return window.createToast("Invalid temperature", "danger")
    
    const changeInPressure = Number(added_pressure) - Number(background_pressure)
    if(changeInPressure < 0) return window.createToast("Negative pressure! correct background pressure!!", "danger")
    if(!changeInPressure) return window.createToast("Invalid pressures", "danger")
    const TkConstants = {
        A: get(TakaishiSensuiConstants).A.value.map(Number),
        B: get(TakaishiSensuiConstants).B.value.map(Number),
        C: get(TakaishiSensuiConstants).C.value.map(Number),
    }
    const C_factor = srgMode ? [1, 0] : [calibration_factor, get(number_density_std).calibration_factor]
    const args = {
        srgMode,
        tube_diameter: [get(tube_diameter), get(number_density_std).tube_diameter], 
        added_pressure: [added_pressure, get(number_density_std).added_pressure],
        room_temperature: [get(room_temperature), get(number_density_std).room_temperature],
        trap_temperature: [trap_temperature, get(number_density_std).trap_temperature],
        background_pressure: [background_pressure, get(number_density_std).background_pressure],
        TakaishiSensuiConstants: TkConstants,
        calibration_factor: C_factor
    }

    console.warn({args})
    const datafromPython = await computePy_func<NumberDensityConfigType>(
        {e, pyfile: 'numberDensity', args}
    )
    console.log({datafromPython})
    if(!datafromPython) return Promise.reject('Computation failed')

    const numberDensity = {nHe: datafromPython.nHe, nHe_transpiration: datafromPython.nHe_transpiration}
    const {X, F} = datafromPython
    return {datafromPython, numberDensity, X, F}
}