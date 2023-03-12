import { fs } from '@tauri-apps/api'
import { writable, get } from 'svelte/store'

export const customStore = <T>(defaultValue: T) => {
    const store = writable<{ [key: string]: T }>({})
    const { subscribe, set, update } = store

    return {
        subscribe,
        set,
        get: (key: string) => get(store)[key],
        getStore: () => get(store),
        update,
        setValue: (key: string, value: T) => {
            update((data) => {
                data[key] = value
                return data
            })
        },
        init: (key: string) => {
            update((data) => {
                data[key] = defaultValue
                return data
            })
        },
        remove: (key: string) => {
            update((data) => {
                if (data[key]) delete data[key]
                return data
            })
        },
    }
}

export const getfiles = async (location: string, filter: string) => {
    if (!(await fs.exists(location))) return []
    const dirs = await fs.readDir(location)
    return dirs
        .map((f) => f.name)
        .filter((f) => f.endsWith(filter))
        .map((f) => ({ name: f, id: window.getID() }))
}
