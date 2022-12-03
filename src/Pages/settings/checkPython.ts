import { pyVersion, developerMode, felionpy, get } from '$lib/pyserver/stores'
import { Command } from '@tauri-apps/api/shell'

export async function getPyVersion(e?: ButtonClickEvent) {
    if (get(developerMode)) {
        const command = new Command('python', ['-V'])
        const output = await tryF(command.execute())
        if (isError(output)) {
            window.createToast(output.message, 'danger')
            return
        }
        const { stdout } = output

        pyVersion.set(stdout?.trim() || '')
        window.createToast('python location updated', 'success')
        return
    }

    const target = e?.target as HTMLButtonElement
    target?.classList.toggle('is-loading')

    // console.log('getPyVersion', get(felionpy))
    // const command = Command.sidecar(get(felionpy), ['getVersion', '{}'])
    // const output = await tryF(command.execute())
    const command = new Command('felionpy', ['getVersion', '{}'])
    const output = await tryF(command.execute())
    console.log(output)
    if (isError(output)) {
        window.createToast(output.message, 'danger')
        target?.classList.toggle('is-loading')
        console.error(output)
        return
    }
    const { stdout, stderr } = output
    console.log({ stdout, stderr })

    target?.classList.toggle('is-loading')
    if (!stdout) return

    const [version] = stdout?.split('\n').filter?.((line) => line.includes('Python')) || ['']
    pyVersion.set(version?.trim() || '')
    window.createToast('python location updated', 'success')
}
