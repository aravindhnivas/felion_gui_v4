import { execute } from '$lib/api/shell'
import { pythonscript, pyVersion, developerMode, pyProgram, get } from '$lib/pyserver/stores'

export async function getPyVersion(e?: ButtonClickEvent) {
    console.log('getPyVersion', get(developerMode), get(pyProgram))
    if (get(developerMode)) {
        const version = (await execute(get(pyProgram), ['-V'])) as string
        pyVersion.set(version || '')
        console.log(version)
        window.createToast('python location updated', 'success')
        return Promise.resolve(get(pyVersion))
    }

    // const target = e?.target as HTMLButtonElement
    // target?.classList.toggle('is-loading')

    // const pyfile = 'getVersion'
    // const pyArgs = get(developerMode) ? await path.join(get(pythonscript), 'main.py') : ''

    // const cmd = `${get(pyProgram)} ${pyArgs} ${pyfile} {} `
    // const command = new shell.Command(cmd)

    // command.on('close', (data) => {
    //     target?.classList.toggle('is-loading')
    //     console.log(`command finished with code ${data.code} and signal ${data.signal}`)
    // })
    // command.on('error', (error) => console.error(`command error: "${error}"`))

    // let stdout = ''
    // let stderr = ''
    // command.stdout.on('data', (line) => {
    //     console.log(`command stdout: "${line}"`)
    //     stdout += line
    // })
    // command.stderr.on('data', (line) => {
    //     stderr += line
    //     console.log(`command stderr: "${line}"`)
    // })

    // const [version] = stdout?.split('\n').filter?.((line) => line.includes('Python')) || ['']
    // pyVersion.set(version?.trim() || '')
    // console.log({ stdout, version })
    // window.createToast('python location updated', 'success')
    // // target?.classList.toggle('is-loading')
    // return Promise.resolve(get(pyVersion))
}
