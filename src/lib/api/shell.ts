import { shell } from '@tauri-apps/api'

export function execute(cmd, args) {
    console.log('execute', cmd, args)

    return new Promise(async (resolve, reject) => {
        const command = new shell.Command(cmd, args)
        let stdout = ''
        let stderr = ''

        const child = await command.spawn()
        // console.log(child)

        command.stdout.on('data', (line) => {
            stdout += line.trim()
            console.log(`command stdout: "${line}"`)

            resolve(stdout)
        })

        command.stderr.on('data', (line) => {
            stderr += line.trim()
            reject(stderr)
        })
    })
}
