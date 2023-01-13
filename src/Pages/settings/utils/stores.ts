import { persistentWritable } from '$src/js/persistentStore'
import { writable } from 'svelte/store'

export const create_logger_store = (value: OutputBoxtype[]) => {
    const { set, subscribe, update } = writable(value)
    const setVal = (log: string | Object) => {
        return typeof log === 'string' ? log : JSON.stringify(log, null, 2)
    }
    const add = (val: OutputBoxtype) => update((output) => [val, ...output])

    return {
        set,
        subscribe,
        update,
        add,
        warn: (log: string | Object) => add({ value: setVal(log), type: 'warning' }),
        error: (log: string | Object) => add({ value: setVal(log), type: 'danger' }),
        info: (log: string | Object) => add({ value: setVal(log), type: 'info' }),
        success: (log: string | Object) => add({ value: setVal(log), type: 'success' }),
    }
}

export const outputbox = create_logger_store([])
export const serverInfo = create_logger_store([])

export const downloadoverrideURL = writable(import.meta.env.DEV)
export const python_asset_ready_to_install = writable(false)
export const python_asset_ready = writable(false)
export const downloadURL = persistentWritable(
    'download_URL_test',
    'https://github.com/aravindhnivas/felionpy/archive/refs/tags/v0.0.11.zip'
)
