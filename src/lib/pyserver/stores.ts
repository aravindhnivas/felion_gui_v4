import { persistentWritable } from '$src/js/persistentStore'
import { path } from '@tauri-apps/api'
import { writable, get, derived } from 'svelte/store'
import type { Child } from '@tauri-apps/api/shell'
export const pythonpath = persistentWritable('pythonpath', 'python')
export const pythonscript = persistentWritable('pythonscript', '')
export const felionpy = persistentWritable('felionpy', 'binaries/felionpy')

export const developerMode = writable(import.meta.env.DEV)
export const pyProgram = derived([developerMode, pythonpath, felionpy], ([$developerMode, $pythonpath, $felionpy]) => {
    return $developerMode ? $pythonpath : $felionpy
})

export const pyServerReady = writable(false)
export const pyVersion = writable('')
export const pyServerPORT = persistentWritable('pyServerPORT', 5050)
export const mainpyfile = derived([developerMode, pythonscript], async ([$developerMode, $pythonscript]) => {
    return $developerMode ? await path.join($pythonscript, 'main.py') : ''
})

export const currentTab = persistentWritable('settingsActiveTab', 'Configuration')
export const serverDebug = persistentWritable('serverDebug', false)
export const pythonPath = persistentWritable('pythonPath', '')
export const pythonScript = persistentWritable('pythonScript', '')

export const pyChildProcess = writable<Child>(null)
export { get }
