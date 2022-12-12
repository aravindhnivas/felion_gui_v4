import { persistentWritable } from '$src/js/persistentStore'
import { writable } from 'svelte/store'

function openModalStore() {
    const defaultValues: {
        type: 'danger' | 'warning'
        content: string | Error
        open: boolean
    } = {
        type: 'warning',
        content: 'Content',
        open: false,
    }

    const { subscribe, set, update } = writable(defaultValues)

    return {
        subscribe,
        set,
        update,
        error(err: unknown) {
            const content = err instanceof Error ? err.stack || err.message : <string>err
            update((_n) => ({ content, type: 'danger', open: true }))
        },
        info(content: string) {
            update((n) => {
                return { content, type: 'warning', open: true }
            })
        },
        reset: () => set(defaultValues),
    }
}
export const mainPreModal = openModalStore()
export const activePage = persistentWritable('activePage', 'Home')
export const running_processes = writable<
    {
        pid: number | undefined
        pyfile: string
        close?: {
            name: string
            cb: () => Promise<void>
            style: string
        }
    }[]
>([])

export const updateInterval = persistentWritable('updateInterval', 15)
export const updateError = writable('')
export const updateStatus = writable('')
