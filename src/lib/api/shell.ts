import { shell } from '@tauri-apps/api'

export function execute(cmd, args) {
    return new Promise(async (resolve, reject) => {
        const command = new shell.Command(cmd, args)
        let stdout = ''
        let stderr = ''

        command.stdout.on('data', (line) => {
            stdout += line.trim()
            resolve(stdout)
        })

        command.stderr.on('data', (line) => {
            stderr += line.trim()
            reject(stderr)
        })

        const child = await command.spawn()
        console.log(child)
    })
}
