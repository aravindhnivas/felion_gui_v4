import get_files_settings_values from '$src/js/get_files_settings_values'
import { path, fs } from '@tauri-apps/api'

export async function readMassFile(massfiles: string[], btnID: string = '') {
    const loadbtn = document.getElementById(btnID)
    try {
        if (loadbtn?.classList.contains('is-loading')) {
            console.warn('Mass spec plot is already loading')
            return null
        }

        loadbtn?.classList.toggle('is-loading')

        const dataToSend: {
            [name: string]: { x: number[]; y: number[]; name: string; mode: string; showlegend: boolean }
        } = {}

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
            dataToSend[name] = { x, y, name: label, mode, showlegend }
        }

        console.info('File read completed')
        return Promise.resolve(dataToSend)
    } catch (error) {
        window.handleError(error)
    } finally {
        loadbtn?.classList.toggle('is-loading')
    }
}

// export function detectPeaks({ data, windowWidth, threshold }) {
//     console.info('detectPeaks', data, windowWidth, threshold)
//     const peaks = []
//     for (let i = 0; i < data.length; i++) {
//         const start = Math.max(0, i - windowWidth)
//         const end = Math.min(data.length, i + windowWidth)
//         let deltaAcc = 0
//         for (let a = start; a < end; a++) {
//             deltaAcc += Math.abs(data[a - 1] - data[a])
//         }
//         if (deltaAcc > threshold) {
//             peaks.push(i)
//         }
//     }
//     return peaks
// }

export function detectPeaks({ data, threshold, windowWidth }) {
    let peaks = []
    let isPeak = false

    for (let i = windowWidth; i < data.length - windowWidth; i++) {
        let windowStart = i - windowWidth
        let windowEnd = i + windowWidth
        let windowMax = Math.max(...data.slice(windowStart, windowEnd))

        if (data[i] > threshold && data[i] === windowMax) {
            isPeak = true
            peaks.push(i)
        } else {
            isPeak = false
        }
    }

    return peaks
}
