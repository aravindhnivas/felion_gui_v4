import { persistentWritable } from '$src/js/persistentStore'
import { writable, get, derived } from 'svelte/store'

// const setDefault = (key: string) => {
//     const initialValue = localStorage.getItem(key)
//     const store = window.persistentDB(key, initialValue)
//     if(window.isPackaged) {store.set(initialValue)};
//     return store
// }

export const pythonpath = persistentWritable('pythonpath', '')
export const pythonscript = persistentWritable('pythonscript', '')
export const felionpy = persistentWritable('felionpy', '')

export const developerMode = persistentWritable('developerMode', import.meta.env.DEV)
// if(window.isPackaged) {developerMode.set(false)};

export const pyProgram = derived(
    [developerMode, pythonpath, felionpy],

    ([$developerMode, $pythonpath, $felionpy]) => {
        return $developerMode ? $pythonpath : $felionpy
    }
)

export const pyServerReady = writable(false)
export const pyVersion = persistentWritable('pyVersion', '')
export const pyServerPORT = persistentWritable('pyServerPORT', 5050)
export const mainpyfile = derived([developerMode, pythonscript], ([$developerMode, $pythonscript]) => {
    return $developerMode ? path.join($pythonscript, 'main.py') : ''
})

export const currentTab = persistentWritable('settingsActiveTab', 'Configuration')
export const serverDebug = persistentWritable('serverDebug', false)
export { get }
