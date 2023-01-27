import { mainPreModal } from '$src/sveltewritables'
import { writable } from 'svelte/store'
import { toast } from '@zerodevx/svelte-toast'
import type { SvelteToastOptions } from '@zerodevx/svelte-toast'
import bulmaQuickview from 'bulma-extensions/bulma-quickview/dist/js/bulma-quickview'
import { tempdir } from '@tauri-apps/api/os'
import { getVersion } from '@tauri-apps/api/app'
import { LOGGER } from '$src/Pages/settings/utils/stores'
export const activateChangelog = writable(false)
export { plot, subplot, plotlyClick, plotlyEventsInfo } from './plot'

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
export const createToast = (description: string, type: toastType = 'info', opts: SvelteToastOptions = {}) => {
    toast.push(description, {
        theme: toastTheme[type],
        pausable: true,
        ...opts,
    })
}

export const handleError = (error: unknown) => {
    window.error = error
    if (typeof error === 'string') {
        mainPreModal.error(error)
    } else {
        mainPreModal.error(error)
    }
}

window.createToast = createToast
window.handleError = handleError
window.sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
window.addEventListener('DOMContentLoaded', async () => {
    currentVersion.set(await getVersion())
    bulmaQuickview.attach()
    window.tempdirPath = await path.join(await tempdir(), 'com.felion.app')
    if (!(await fs.exists(window.tempdirPath))) {
        await fs.createDir(window.tempdirPath)
    }
    LOGGER.info('DOM fully loaded and parsed')
})

window.getID = () => Math.random().toString(32).substring(2)
if (import.meta.env.PROD) {
    window.document.addEventListener('contextmenu', (e) => e.preventDefault())
}
