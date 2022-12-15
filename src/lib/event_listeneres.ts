import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { appWindow } from '@tauri-apps/api/window'
import { confirm } from '@tauri-apps/api/dialog'
import { stopServer } from '$lib/pyserver/felionpyServer'

const update_events = {
    CHECK_UPDATE: 'tauri://update',
    UPDATE_AVAILABLE: 'tauri://update-available',
    INSTALL_UPDATE: 'tauri://update-install',
    STATUS_UPDATE: 'tauri://update-status',
    DOWNLOAD_PROGRESS: 'tauri://update-download-progress',
}

export const events_listeners = async () => {
    const unlisten_closeEvent = await appWindow.onCloseRequested(async (event) => {
        const confirmed = await confirm('Are you sure?')
        if (!confirmed) {
            event.preventDefault()
        }
        await stopServer()
    })
    let unlisteners: UnlistenFn[] = []
    let i = 0
    for (const event in update_events) {
        unlisteners[i] = await listen(update_events[event], function (res) {
            console.log('New status: ', res)
        })
        i++
    }
    return Promise.resolve([unlisten_closeEvent, ...unlisteners])
}
