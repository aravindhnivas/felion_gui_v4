import { appWindow } from '@tauri-apps/api/window'
import { confirm } from '@tauri-apps/api/dialog'
import { stopServer } from '$lib/pyserver/felionpyServer'
export const events_listeners = async () => {
    const unlisten_closeEvent = await appWindow.onCloseRequested(async (event) => {
        if (!(await confirm('Are you sure to close the application?'))) {
            event.preventDefault()
        }
        await stopServer()
    })
    return Promise.resolve([unlisten_closeEvent])
}
