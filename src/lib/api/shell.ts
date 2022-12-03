import { shell } from '@tauri-apps/api'
import { felionpy, get } from '$lib/pyserver/stores'
export function execute(cmd, args) {
    console.log('execute', cmd, args)

    return new Promise(async (resolve, reject) => {
        const command = new shell.Command(cmd, args)
        const { stdout, stderr } = await command.execute()
        console.log({ stdout, stderr })
        if (stderr) {
            reject(stderr)
            return
        }

        resolve(stdout)
    })
}

export function felionpy_program(args) {
    console.log('felionpy', args)

    return new Promise(async (resolve, reject) => {
        const command = new shell.Command(get(felionpy), args)
        const child = await command.spawn()
        console.log({ child })

        let stdout = ''
        let stderr = ''

        command.on('close', (data) => {
            resolve({ stdout, stderr })
            console.log(`command finished with code ${data.code} and signal ${data.signal}`)
        })

        command.on('error', (error) => {
            console.error(`command error: "${error}"`)
            reject(error)
        })

        command.stdout.on('data', (line) => {
            stdout += line.trim()
            console.log(`command stdout: "${line}"`)
        })

        command.stderr.on('data', (line) => {
            stderr += line.trim()
        })
    })
}
