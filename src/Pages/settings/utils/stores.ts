import { persistentWritable } from '$src/js/persistentStore'
import { writable } from 'svelte/store'

const makeStore = (value: OutputBoxtype[]) => {
    const { set, subscribe, update } = writable(value)
    return {
        set,
        subscribe,
        update,
        add: (val: OutputBoxtype) => update((output) => [val, ...output]),
    }
}

export const outputbox = makeStore([])
export const downloadoverrideURL = persistentWritable('downloadoverrideURL', false)
export const override_felionpy_version_check = persistentWritable('override_felionpy_version_check', false)
export const unzip_downloaded_assets = persistentWritable('unzip_downloaded_assets', false)
export const downloadURL = persistentWritable(
    'download_URL_test',
    'https://github.com/aravindhnivas/felionpy/archive/refs/tags/v0.0.11.zip'
)
