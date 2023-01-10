import { persistentWritable } from "$src/js/persistentStore";
import { writable } from "svelte/store";

const makeStore = (value: OutputBoxtype[]) => {
    const {set, subscribe, update} = writable(value)
    return {
        set, subscribe, update,
        add: (val: OutputBoxtype) => update((output) => ([val, ...output]))
    }
}

export const outputbox = makeStore([])

export const downloadoverrideURL = writable(false)

export const downloadURL = persistentWritable(
    'download_URL_test',
    'https://github.com/aravindhnivas/felionpy/archive/refs/tags/v0.0.11.zip'
)