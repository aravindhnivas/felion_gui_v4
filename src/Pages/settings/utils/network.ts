import { currentPortPID } from '$src/lib/pyserver/felionpyServer'
export const checkNetstat = async (port: number, currentplatform: string) => {
    let out: OutputBoxtype[] = [{ value: 'checking netstat...', type: 'info' }]

    const [_err, output] = await oO(new shell.Command(`netstat-${currentplatform}`, ['-ano']).execute())
    if (_err) return window.handleError(_err)

    if (output.stderr) {
        out = [{ value: output.stderr.trim(), type: 'danger' }, ...out]
        return out
    }

    // console.log(output.stdout)
    const result = output.stdout
        .trim()
        .split('\n')
        .filter((ln) => ln.includes(`:${port}`))
        .map((ln) => ln.trim())

    result.forEach((value) => {
        out = [...out, { value, type: 'info' }]
    })
    if (!out) {
        out = [{ value: 'NETSTAT: nothing found', type: 'danger' }, ...out]
    }
    return out
}

export const killPID = async (currentplatform: string) => {
    const fullports = get(currentPortPID)
    if (fullports.length < 1) return window.createToast('Enter PID in currentPortPID', 'danger')

    let out: OutputBoxtype[] = []

    const kill = async (port: string) => {
        const [_err, output] = await oO(
            new shell.Command(`taskkill-${currentplatform}`, ['/PID', port, '/F']).execute()
        )

        if (_err) return window.handleError(_err)
        currentPortPID.update((ports) => ports.filter((p) => p !== port))
        if (output.stderr) {
            out = [{ value: output.stderr.trim(), type: 'danger' }, ...out]
            return out
        }
        out = [{ value: output.stdout.trim(), type: 'success' }, ...out]
    }
    for (const port of fullports) {
        await kill(port)
    }
    return out
}
