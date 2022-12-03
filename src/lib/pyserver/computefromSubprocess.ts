import { pyProgram, pythonscript, get, pyVersion, pyServerReady, developerMode } from './stores'
import { running_processes } from '$src/sveltewritables'
import { path, fs, shell } from '@tauri-apps/api'
export const dispatchEvent = (target: HTMLButtonElement | null | undefined, detail: Object, eventName: string) => {
    if (!target) return
    const event = new CustomEvent(eventName, { bubbles: false, detail })
    target.dispatchEvent(event)
    console.info(eventName + ' dispatched')
}

interface Type {
    pyfile: string
    args: Object
    target?: HTMLButtonElement | null
    general?: boolean
    e?: Event
    button?: HTMLButtonElement | null
    computepyfile?: string
    detached?: boolean
}

export default async function ({
    e,
    target,
    button,
    general = false,
    pyfile,
    args,
    computepyfile = 'main',
}: Type): Promise<DataFromPython | undefined | string> {
    return new Promise(async (resolve) => {
        let outputFile: string
        target ||= button || (e?.target as HTMLButtonElement)

        if (pyfile === 'server') {
            pyServerReady.set(false)
        }

        if (!general) {
            const filename = pyfile.split('.').at(-1) + '_data.json'
            const outputFile = await path.join(window.tempdirPath, 'FELion_GUI3', filename)
            if (fs.exists(outputFile)) {
                const output = await tryF(fs.removeFile(outputFile))
                if (isError(output)) console.error(output)
            }
            target?.classList.toggle('is-loading')
        }

        pyVersion.set(localStorage.getItem('pyVersion'))
        if (!get(pyVersion)) {
            window.handleError('Python is not valid. Fix it in Settings --> Configuration')
            return
        }

        console.info('Sending general arguments: ', args)
        window.createToast('Process Started')

        const sendArgs = [pyfile, JSON.stringify(args)]
        const mainPyFile = await path.join(get(pythonscript), computepyfile + '.py')

        // const command_suffix = get(developerMode) ? '-dev' : ''
        const pyArgs = get(developerMode) ? [mainPyFile, ...sendArgs] : sendArgs
        // const cmd = `felionpy${command_suffix}`
        console.log(get(pyProgram), pyArgs)
        const py = new shell.Command(get(pyProgram), pyArgs)
        const pyChild = await py.spawn()

        if (pyfile !== 'server') {
            running_processes.update((p) => [
                ...p,
                {
                    pid: pyChild.pid,
                    pyfile,
                    close: {
                        name: 'X',
                        cb: async () => await pyChild.kill(),
                        style: 'background: var(--color-danger); cursor: pointer; color: var(--color-white);',
                    },
                },
            ])
        }

        py.on('error', (err) => {
            window.handleError(err)

            if (pyfile !== 'server') {
                running_processes.update((p) => p.filter((p) => p.pid !== pyChild.pid))
            }
            return
        })

        // const logDir = await path.appLogDir()
        // const logFile = await path.join(logDir, pyfile + '_data.log')
        // window.fs.ensureDirSync(window.path.dirname(logFile))
        // const loginfo = window.fs.createWriteStream(logFile)

        let error = ''
        let dataReceived = ''
        dispatchEvent(target, { py, pyfile }, 'pyEvent')

        py.on('close', async () => {
            if (pyfile === 'server') {
                pyServerReady.set(false)
            }

            dispatchEvent(target, { py, pyfile, dataReceived, error }, 'pyEventClosed')
            if (pyfile !== 'server') {
                running_processes.update((p) => p.filter((p) => p.pid !== pyChild.pid))
            }

            if (error) {
                resolve(undefined)
                // loginfo.write(`\n\n[ERROR OCCURED]\n${error}\n`)
                // loginfo.end()

                if (error.includes('Traceback')) {
                    return window.handleError(error)
                }
                return console.error(error)
            }

            if (general) {
                return resolve(dataReceived)
            }

            if (!(await fs.exists(outputFile))) {
                console.warn(`${outputFile} file doesn't exists`)
                window.handleError(`${outputFile} file doesn't exists`)
                return resolve(undefined)
            }

            const output = await tryF(fs.readTextFile(outputFile))
            if (isError(output)) {
                return window.handleError(output)
            }
            const dataFromPython: DataFromPython = tryF(() => JSON.parse(output))
            if (isError(dataFromPython)) {
                resolve(undefined)
                return window.handleError(dataFromPython)
            }
            resolve(dataFromPython)

            if (target?.classList.contains('is-loading')) {
                target.classList.remove('is-loading')
            }
            console.info('Process closed')
        })

        py.stderr.on('data', (errorString) => {
            // const errorString = `${String.fromCharCode.apply(null, err)}\n`
            if (pyfile === 'server') {
                error = errorString
            } else {
                error += errorString
            }
            dispatchEvent(target, { py, pyfile, error }, 'pyEventStderr')
            console.log(`Output from python: ${errorString}`)
        })

        py.stdout.on('data', (dataString) => {
            // loginfo.write(dataString)
            // const dataString = `${String.fromCharCode.apply(null, data)}\n`
            if (pyfile === 'server') {
                dataReceived = dataString
            } else {
                dataReceived += dataString
            }
            console.log(dataString.trim())
            dispatchEvent(target, { py, pyfile, dataReceived, stdout: dataString }, 'pyEventData')
        })

        if (pyfile === 'server') {
            pyServerReady.set(true)
        }
    })
}
