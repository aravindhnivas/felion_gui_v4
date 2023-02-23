import {
    pyProgram,
    serverDebug,
    pyServerReady,
    developerMode,
    pyServerPORT,
    pythonscript,
    pyChildProcess,
} from '$lib/pyserver/stores'
import { serverInfo } from '$src/Pages/settings/utils/stores'
import { python_asset_ready } from '$src/Pages/settings/utils/stores'
import { killPID } from '$src/Pages/settings/utils/network'

export const currentPortPID = persistentWritable<string[]>('pyserver-pid', [])

export async function startServer() {
    if (!get(developerMode) && !get(python_asset_ready)) return serverInfo.error('python asset not ready')
    if (get(pyServerReady)) return window.createToast('server already running', 'danger')
    serverInfo.warn('starting felionpy server at port: ' + get(pyServerPORT))

    if(get(currentPortPID).length > 0) {
        await killPID()
    }

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
        return
    }

    pyChildProcess.set(pyChild)
    pyServerReady.set(true)
    currentPortPID.update((ports) => [...ports, `${pyChild.pid}`])

    py.on('close', () => {
        pyServerReady.set(false)
        currentPortPID.update((ports) => ports.filter((p) => p !== `${get(pyChildProcess).pid}`)) // remove pid from list   
        serverInfo.warn('server closed')
    })

    py.on('error', (error) => {
        window.handleError(error)
        serverInfo.error(error)
    })

    py.stderr.on('data', (stderr) => {
        if (!stderr.trim()) return
        serverInfo.warn(stderr.trim())
    })

    py.stdout.on('data', (stdout) => {
        if (!stdout.trim()) return
        serverInfo.info(stdout.trim())
    })

    return Promise.resolve('server started')
}

export async function stopServer() {
    try {
        
        if (!get(pyServerReady)) {
            serverInfo.warn('Server already stopped')
            return
        }

        if (get(pyChildProcess).kill) {
            await get(pyChildProcess).kill()
        }

        pyServerReady.set(false)

        return Promise.resolve(true)

    } catch (error) {
        if (error instanceof Error) {
            window.handleError(error)
        }
    }
}
