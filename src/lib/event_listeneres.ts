import { appWindow } from '@tauri-apps/api/window'
import { stopServer } from '$lib/pyserver/felionpyServer'
export const events_listeners = async () => {
    const unlisten_closeEvent = await appWindow.onCloseRequested(async (event) => {
        await stopServer()
    })
    return [unlisten_closeEvent]
}
