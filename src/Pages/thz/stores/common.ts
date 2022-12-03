import { persistentWritable } from '$src/js/persistentStore'
import { fs, path } from '@tauri-apps/api'
import { derived, writable } from 'svelte/store'

export const electronSpin = writable<boolean>(false)
export const zeemanSplit = writable<boolean>(false)

export const configFile = writable(localStorage.getItem('ROSAA_configfile') ?? '')
export const currentLocation = persistentWritable('ROSAA_currentLocation', '')
export const output_dir = derived(currentLocation, ($currentLocation) => {
    return $currentLocation + path.sep + 'output' + path.sep + 'data'
})

export const figs_dir = derived(currentLocation, ($currentLocation) => {
    return $currentLocation + path.sep + 'output' + path.sep + 'figs'
})

export const excitedTo = writable<string>('')
export const excitedFrom = writable<string>('')
export const trapTemp = writable<number>(5)

export const numberDensity = writable<string>('')
export const trapArea = writable<string>('')

export const collisionalTemp = writable<number>(7)
export const configLoaded = writable<boolean>(false)
export const plot_colors = writable('default')
