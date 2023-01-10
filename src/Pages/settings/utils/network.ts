export const checkNetstat = async (port: number, currentplatform: string) => {
    const [_err, output] = await oO(new shell.Command(`netstat-${currentplatform}`, ['-ano']).execute())

    if (_err) return window.handleError(_err)
    let out: OutputBoxtype[] = []

    if (output.stderr) {
        out = [{ value: output.stderr.trim(), type: 'danger' }]
        return out
    }
    const result = output.stdout
        .trim()
        .split('\n')
        .filter((ln) => ln.includes(`:${port}`))
        .map((ln) => ln.trim())
    
    result.forEach((value) => {
        out = [...out, { value, type: 'info' }]
    })
    return out
}

export const killPID = async (currentPortPID, currentplatform) => {
    if (!currentPortPID) return window.createToast('Enter PID in currentPortPID', 'danger')
    const [_err, output] = await oO(
        new shell.Command(`taskkill-${currentplatform}`, ['/PID', currentPortPID, '/F']).execute()
    )

    if (_err) return window.handleError(_err)
    let out: OutputBoxtype[] = []

    if (output.stderr) {
        out = [{ value: output.stderr.trim(), type: 'danger' }]
        return out
    }
    out = [{ value: output.stdout.trim(), type: 'success' }]
    return out
}