import { currentPortPID } from '$src/lib/pyserver/felionpyServer'
import { pyServerPORT } from '$src/lib/pyserver/stores'
import { serverInfo } from './stores'

const fail = (error) => {
    serverInfo.error('failed to check network status')
    serverInfo.error(error)
    return false
}
export const checkNetstat = async () => {
    
    serverInfo.warn('checking server network status...')

    const args = {
        win32: ['Get-Process', '-Id', `(Get-NetTCPConnection -LocalPort ${get(pyServerPORT)}).OwningProcess`],
        darwin: ['-i', `:${get(pyServerPORT)}`],
        linux: ['-i', `:${get(pyServerPORT)}`],
    }
    const currentplatform = await platform()
    const command = currentplatform === 'win32' ? `netstat-${await platform()}` : 'netstat-darwin'
    const [err, output] = await oO(new shell.Command(command, args[await platform()]).execute())
    if (err) return fail(err)

    if (output.stderr) return fail(output.stderr)
    serverInfo.warn(output.stdout)
    serverInfo.warn('network status check done!')
    return true
}

export const killPID = async () => {
    const fullports = get(currentPortPID)
    if (fullports.length < 1) return window.createToast('Enter PID in currentPortPID', 'danger')

    const kill = async (port: string) => {
        const args = {
            win32: ['/PID', port, '/F'],
            darwin: ['-9', port],
            linux: ['-9', port],
        }
        const currentplatform = await platform()
        const command = currentplatform === 'win32' ? `taskkill-${await platform()}` : 'taskkill-darwin'
        const [_err, output] = await oO(new shell.Command(command, args[await platform()]).execute())

        if (_err) return window.handleError(_err)
        currentPortPID.update((ports) => ports.filter((p) => p !== port))
        if (output.stderr) {
            return serverInfo.error(output.stdout)
        }
        serverInfo.success(output.stdout)
    }
    for (const port of fullports) {
        await kill(port)
    }
}
