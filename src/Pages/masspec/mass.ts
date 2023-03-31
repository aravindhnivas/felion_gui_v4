import get_files_settings_values from '$src/js/get_files_settings_values'
import { path, fs } from '@tauri-apps/api'
import colors from '$lib/misc/colors'
export async function readMassFile(massfiles: string[], btnID: string = '') {
    const loadbtn = document.getElementById(btnID)
    try {
        if (loadbtn?.classList.contains('is-loading')) {
            console.warn('Mass spec plot is already loading')
            return null
        }

        loadbtn?.classList.toggle('is-loading')

        const dataToSend: {
            [name: string]: Partial<Plotly.PlotData>
        } = {}

        let i = 0
        for (const filename of massfiles) {
            if (!fs.exists(filename)) {
                window.createToast(`File ${filename} does not exist`, 'danger')
                // return Promise.resolve(null)
                continue
            }

            const [_err, fileContents] = await oO(fs.readTextFile(filename))
            if (_err) {
                // window.handleError(fileContents)
                window.createToast(`${filename} couldn't be opened`, 'danger')
                continue
            }

            const name = await path.basename(filename)
            console.info('content read: ', name)
            const dataContents = fileContents
                .split('\n')
                .filter((line) => line && !line.includes('#'))
                .map((line) =>
                    line
                        .trim()
                        .split('\t')
                        .map((data) => parseFloat(data))
                )

            console.info({ dataContents }, name, 'filtered')
            console.info(dataContents[0])
            const [x, y] = dataContents[0].map((_, colIndex) => {
                return dataContents.filter((row) => !isNaN(row[0])).map((row) => row[colIndex])
            })
            const mode = 'lines'
            const showlegend = true
            console.info(name, 'done\n')

            const fileVariableComputedValues = await get_files_settings_values(filename)
            const res = fileVariableComputedValues['m03_ao13_reso']
            const b0 = fileVariableComputedValues['m03_ao09_width'] / 1000
            const trap = fileVariableComputedValues['m04_ao04_sa_delay'] / 1000

            const label = `${name}: Res:${res?.toFixed(1)} V; B0: ${b0?.toFixed(0)} ms; trap: ${trap?.toFixed(0)} ms`
            dataToSend[name] = { x, y, name: label, mode, showlegend, line: { color: `rgb${colors[i]}` } }
            i++
        }

        console.info('File read completed')
        return Promise.resolve(dataToSend)
    } catch (error) {
        window.handleError(error)
    } finally {
        loadbtn?.classList.toggle('is-loading')
    }
}
