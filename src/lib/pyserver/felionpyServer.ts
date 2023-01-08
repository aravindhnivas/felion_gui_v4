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

import { path, shell } from '@tauri-apps/api'

export async function startServer() {
    if (get(pyServerReady)) return console.info('Server already running')
    // const serverDebug = JSON.parse(localStorage.getItem('serverDebug')) ?? false
    // const availablePORT = (await invoke('get_tcp_port')) as number
    // pyServerPORT.set(availablePORT)
    console.info('starting felionpy server at port: ', get(pyServerPORT))

    pyServerReady.set(false)
    const pyfile = 'server'
    const sendArgs = [pyfile, JSON.stringify({ port: get(pyServerPORT), debug: get(serverDebug) })]
    const mainPyFile = await path.join(get(pythonscript), 'main.py')

    try {
        const pyArgs = get(developerMode) ? [mainPyFile, ...sendArgs] : sendArgs
        console.log(get(pyProgram), pyArgs)
        const py = new shell.Command(get(pyProgram), pyArgs)

        const pyChild = await py.spawn()
        pyChildProcess.set(pyChild)
        pyServerReady.set(true)

        localStorage.setItem('pyserver-pid', `${pyChild.pid}`)

        py.on('close', () => {
            pyServerReady.set(false)
        })

        py.on('error', (error) => {
            window.handleError(error)
        })

        py.stderr.on('data', (stderr) => {
            console.warn("Server's stderr", stderr)
        })

        py.stdout.on('data', (stdout) => {
            console.info("Server's stdout: ", stdout)
        })
    } catch (error) {
        window.handleError(error)
    }
}

export async function stopServer() {
    try {
        if (!get(pyServerReady)) {
            console.info('Server already stopped')
            return
        }
        if (get(pyChildProcess).kill) {
            await get(pyChildProcess).kill()
            localStorage.removeItem('pyserver-pid')
        }

        pyServerReady.set(false)

        return Promise.resolve(true)
    } catch (error) {
        if (error instanceof Error) {
            window.handleError(error)
        }
    }
}
