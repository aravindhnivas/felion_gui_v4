import { SpeedOfLight } from '$src/js/constants'
import { fs } from '@tauri-apps/api'
import { parse as Yml } from 'yaml'

export const wavenumberToMHz = (energy: ValueLabel<number>) => ({
    ...energy,
    value: Number(energy.value * SpeedOfLight * 1e2 * 1e-6),
})

export const MHzToWavenumber = (energy: ValueLabel<number>) => ({
    ...energy,
    value: Number(energy.value / (SpeedOfLight * 1e2 * 1e-6)),
})

export const getYMLFileContents = async (filename: string) => {
    if (!(await fs.exists(filename))) return Promise.reject(filename + " file doesn't exist")
    const fileContent = await fs.readTextFile(filename)
    if (isError(fileContent)) return Promise.reject("Couldn't read file " + filename)
    const YMLcontent = Yml(fileContent)
    return Promise.resolve(YMLcontent)
}

export const setID = <T extends OnlyValueLabel<T['value']>>(obj: T): ValueLabel<T['value']> => ({
    ...obj,
    id: window.getID(),
})

export const correctObjValue = (obj: ValueLabel) => ({
    ...obj,
    value: Number(obj.value).toExponential(3),
})

const nominal_std_fn = (value: string, ind: 0 | 1 = 0) => {
    if (value.includes('e')) {
        const [value_std, power] = value.split('e')
        return value_std.split('+/-')[ind].replace(ind === 0 ? '(' : ')', '') + `e${power}`
    }
    return value.split('+/-')[ind]
}

export const get_nominal_value = (value: string | string[]) => {
    if (typeof value === 'object') return value.map(nominal_std_fn)
    return nominal_std_fn(value)
}

export const get_std_value = (value: string | string[]) => {
    if (typeof value === 'object') return value.map((val) => nominal_std_fn(val, 1))
    return nominal_std_fn(value, 1)
}
