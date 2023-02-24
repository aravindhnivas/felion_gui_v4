export const number_density_std = persistentWritable('number_density_std', {
    srgMode: 0,
    tube_diameter: 0.1, 
    added_pressure: '10', // percent
    room_temperature: 1,
    trap_temperature: 0.5,
    background_pressure: 0,
    TakaishiSensuiConstants: {A: 0, B: 0, C: 0},
    calibration_factor: 10,
})
export const room_temperature = persistentWritable("room_temperature", 300)
export const calibration_factor = persistentWritable("calibration_factor", 200)

export const TakaishiSensuiConstants = persistentWritable("TakaishiSensuiConstants", {
    A: {value: [6.11, 0], unit: "(K / mm.Pa)^2"},
    B: {value: [4.26, 0], unit: "K / mm.Pa"},
    C: {value: [0.52, 0], unit: "(K / mm.Pa)^0.5"}
})

export const tube_diameter = persistentWritable("tube_diameter", 3)
