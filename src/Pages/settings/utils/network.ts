import { currentPortPID } from '$src/lib/pyserver/felionpyServer'
import { pyServerPORT } from '$src/lib/pyserver/stores'
import { serverInfo } from './stores'

export const checkNetstat = async () => {
    const args = {
        win32: ['Get-Process', '-Id', `(Get-NetTCPConnection -LocalPort ${get(pyServerPORT)}).OwningProcess`],
        darwin: ['-i', `:${get(pyServerPORT)}`],
    }

    const [err, output] = await oO(new shell.Command(`netstat-${await platform()}`, args[await platform()]).execute())
    if (err) throw err

    if (output.stderr) throw output.stderr

    serverInfo.warn(output.stdout.trim())
}

export const killPID = async () => {
    const fullports = get(currentPortPID)
    if (fullports.length < 1) return window.createToast('Enter PID in currentPortPID', 'danger')

    const kill = async (port: string) => {
        const args = {
            win32: ['/PID', port, '/F'],
            darwin: ['-9', port],
        }
        const [_err, output] = await oO(
            new shell.Command(`taskkill-${await platform()}`, args[await platform()]).execute()
        )

        if (_err) return window.handleError(_err)
        currentPortPID.update((ports) => ports.filter((p) => p !== port))
        if (output.stderr) {
            return serverInfo.error(output.stdout.trim())
        }
        serverInfo.success(output.stdout.trim())
    }
    for (const port of fullports) {
        await kill(port)
    }
}
