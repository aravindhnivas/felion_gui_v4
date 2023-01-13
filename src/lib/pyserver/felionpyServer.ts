import {
    pyProgram,
    developerMode,
    pyServerReady,
    pyServerPORT,
    pythonscript,
    serverDebug,
    pyChildProcess,
    get,
} from '$lib/pyserver/stores'
import { LOGGER } from '$console'
import { python_asset_ready } from '$src/Pages/settings/utils/stores'

import { persistentWritable } from '$src/js/persistentStore'
import { path, shell } from '@tauri-apps/api'

export const currentPortPID = persistentWritable<string[]>('pyserver-pid', [])

export async function startServer() {
    if (!get(developerMode) && !get(python_asset_ready)) {
        dialog.message('python assets are missing. Download it in Settings -> Update', {
            title: 'Missing assets',
            type: 'error',
        })
        return Promise.reject('python assets are missing')
    }
    if (get(pyServerReady)) return Promise.reject('server already running')

    console.info('starting felionpy server at port: ', get(pyServerPORT))

    pyServerReady.set(false)
    const pyfile = 'server'
    const sendArgs = [pyfile, JSON.stringify({ port: get(pyServerPORT), debug: get(serverDebug) })]
    const mainPyFile = await path.join(get(pythonscript), 'main.py')

    const pyArgs = get(developerMode) ? [mainPyFile, ...sendArgs] : sendArgs
    console.log(get(pyProgram), pyArgs)
    const py = new shell.Command(get(pyProgram), pyArgs)

    const [err, pyChild] = await oO(py.spawn())
    if (err) {
        window.handleError(err)
        return Promise.reject(err)
    }

    pyChildProcess.set(pyChild)
    pyServerReady.set(true)
    currentPortPID.update((ports) => [...ports, `${pyChild.pid}`])

    py.on('close', () => {
        pyServerReady.set(false)
        LOGGER.warn('server closed')
    })

    py.on('error', (error) => {
        window.handleError(error)
        LOGGER.error(error)
    })

    py.stderr.on('data', (stderr) => {
        LOGGER.warn("Server's stderr", stderr)
    })

    py.stdout.on('data', (stdout) => {
        LOGGER.info("Server's stdout: ", stdout)
    })

    await window.sleep(500)
    return Promise.resolve('server started')
}

export async function stopServer() {
    try {
        if (!get(pyServerReady)) {
            console.info('Server already stopped')
            return
        }
        if (get(pyChildProcess).kill) {
            await get(pyChildProcess).kill()
            currentPortPID.update((ports) => ports.filter((p) => p !== `${get(pyChildProcess).pid}`))
        }

        pyServerReady.set(false)

        return Promise.resolve(true)
    } catch (error) {
        if (error instanceof Error) {
            window.handleError(error)
        }
    }
}
