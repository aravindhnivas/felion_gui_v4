import { pyProgram, developerMode, pyServerReady, pyServerPORT, pythonscript, get } from '$lib/pyserver/stores'
import { invoke, path, shell } from '@tauri-apps/api'
import type { Child } from '@tauri-apps/api/shell'

export let pyChildProcess: Child = null

export async function startServer() {
    if (get(pyServerReady)) return console.info('Server already running')
    const serverDebug = JSON.parse(localStorage.getItem('serverDebug')) ?? false
    // const availablePORT = (await invoke('get_tcp_port')) as number
    // pyServerPORT.set(availablePORT)
    console.info('starting felionpy server at port: ', get(pyServerPORT))

    pyServerReady.set(false)
    const pyfile = 'server'
    const sendArgs = [pyfile, JSON.stringify({ port: get(pyServerPORT), debug: serverDebug })]
    const mainPyFile = await path.join(get(pythonscript), 'main.py')

    try {
        const pyArgs = get(developerMode) ? [mainPyFile, ...sendArgs] : sendArgs
        console.log(get(pyProgram), pyArgs)
        const py = new shell.Command(get(pyProgram), pyArgs)
        pyChildProcess = await py.spawn()

        pyServerReady.set(true)
        py.on('close', () => {
            pyServerReady.set(false)
        })

        py.on('error', (error) => {
            window.handleError(error)
        })

        py.stderr.on('data', (stderr) => {
            console.warn('STDERR: ', stderr)
        })

        py.stdout.on('data', (stdout) => {
            console.info("Server's stdout: ", stdout)
        })
    } catch (error) {
        window.handleError(error)
    }
}

export async function stopServer() {
    if (!get(pyServerReady)) return console.info('Server already stopped')
    pyServerReady.set(false)
    pyChildProcess.kill()
    pyChildProcess = null
}
