import { mainPreModal } from '$src/sveltewritables'
import { writable } from 'svelte/store'
import { toast } from '@zerodevx/svelte-toast'
import type { SvelteToastOptions } from '@zerodevx/svelte-toast'
import bulmaQuickview from 'bulma-extensions/bulma-quickview/src/js/index.js'
import { tempdir } from '@tauri-apps/api/os'
export const activateChangelog = writable(false)
export const windowLoaded = writable(false)
export const updateAvailable = writable(false)
export const newVersion = writable('')
export const updating = writable(false)
export { plot, subplot, plotlyClick, plotlyEventsInfo } from './plot'

import { getVersion } from '@tauri-apps/api/app'

export const currentVersion = writable('')

type ToastThemeOpts = {
    [key in 'info' | 'success' | 'warning' | 'danger']: { [key: string]: string }
}
const toastTheme: ToastThemeOpts = <const>{
    info: {},
    success: {
        '--toastBackground': '#48BB78',
        '--toastBarBackground': '#2F855A',
    },
    danger: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030',
    },
    warning: {
        '--toastBackground': '#FFB84D',
        '--toastBarBackground': '#C28B00',
    },
}

export const callback_toast = (message: string, theme: keyof ToastThemeOpts = 'info', options?: SvelteToastOptions) => {
    toast.push(message, {
        theme: toastTheme[theme],
        ...options,
    })
}

type toastType = keyof ToastThemeOpts
const toastIcons: { [name in toastType]: string } = {
    info: '',
    success: `<lord-icon trigger="loop" src="/assets/icons/lottie/confetti.json"></lord-icon>`,
    danger: `<lord-icon trigger="loop" src="/assets/icons/lottie/error.json"></lord-icon>`,
    warning: `<lord-icon trigger="loop" src="/assets/icons/lottie/error.json"></lord-icon>`,
}
export const createToast = (description: string, type: toastType = 'info', opts: SvelteToastOptions = {}) => {
    const description_modified = `<div class='align'>${toastIcons[type]} <div>${description}</div></div>`
    toast.push(description_modified, {
        theme: toastTheme[type],
        pausable: true,
        ...opts,
    })
}

export const handleError = (error: unknown) => {
    window.error = error
    // console.error(error)
    if (typeof error === 'string') {
        mainPreModal.error(error)
    } else {
        mainPreModal.error(error)
    }
}

window.createToast = createToast
window.handleError = handleError

window.sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

window.addEventListener('DOMContentLoaded', async (event) => {
    console.log('DOM fully loaded and parsed')
    currentVersion.set(await getVersion())
    windowLoaded.set(true)
    bulmaQuickview.attach()
    window.tempdirPath = await tempdir()
    const tempfiledir = await path.join(window.tempdirPath, 'com.felion.app')
    if(!await fs.exists(tempfiledir)) {
        await fs.createDir(tempfiledir)
    }
})

window.getID = () => Math.random().toString(32).substring(2)
if (import.meta.env.PROD) {
    window.document.addEventListener('contextmenu', (e) => e.preventDefault())
}
