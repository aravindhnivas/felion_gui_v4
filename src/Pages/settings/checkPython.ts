import { pyVersion, developerMode, get } from '$lib/pyserver/stores'
import { Command } from '@tauri-apps/api/shell'

export async function getPyVersion(e?: ButtonClickEvent) {
    if (get(developerMode)) {
        const command = new Command('python', ['-V'])
        const [_err, output] = await oO(command.execute())
        if (typeof _err === 'string') {
            window.createToast(_err, 'danger')
            return
        }
        const { stdout } = output

        pyVersion.set(stdout?.trim() || '')
        // window.createToast('python location updated', 'success')
        return
    }

    const target = e?.target as HTMLButtonElement
    target?.classList.toggle('is-loading')

    const command = new Command('felionpy', ['getVersion', '{}'])
    const [_err, output] = await oO(command.execute())
    if (typeof _err === 'string') {
        window.createToast(_err, 'danger')
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
    // window.createToast('python location updated', 'success')
}
