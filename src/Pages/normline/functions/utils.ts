import {
    felix_fulldata,
    opoMode,
    OPO_fulldata,
    normMethod,
    felix_peak_detection,
    fileChecked,
    felixPeakTable,
    felixPlotAnnotations,
    felixOutputName,
} from './svelteWritables'
import { find_peaks } from '$src/lib/misc/utils'
import { plotlayout } from './plot_labels'
import { set_peaks } from './misc'
import colors from '$src/lib/misc/colors'

export const get_graphDiv = (uniqueID: string) => {
    const mode = opoMode.get(uniqueID)

    const graphDiv = `${uniqueID}-${mode ? 'opoRelPlot' : 'avgplot'}`
    const baseGraphDiv = `${uniqueID}-${mode ? 'opoplot' : 'bplot'}`
    return { graphDiv, baseGraphDiv }
}

export const get_fulldata = (uniqueID: string) => {
    const mode = opoMode.get(uniqueID)
    return mode ? OPO_fulldata.get(uniqueID) : felix_fulldata.get(uniqueID)
}

export const find_felix_opo_peaks = async ({ uniqueID, toast = false, addedFile }) => {
    try {
        const { graphDiv } = get_graphDiv(uniqueID)
        relayout(graphDiv, { annotations: [], shapes: [] })

        felixPeakTable.setValue(uniqueID, [])
        felixPlotAnnotations.setValue(uniqueID, [])

        let filename = felixOutputName.get(uniqueID)
        filename = fileChecked.get(uniqueID).find((f) => f.includes(filename))
        if (filename === 'averaged') filename = 'average'
        console.log('Finding peaks for ', filename)

        let x: number[] = []
        let y: number[] = []

        if (filename.endsWith('felix')) {
            const { key } = plotlayout[normMethod.get(uniqueID)]
            const data = get_fulldata(uniqueID)[key][filename] as { x: number[]; y: number[] }
            if (!data) return window.createToast('No data available to find peaks', 'danger')
            ;({ x, y } = data)
        } else {
            const [xCol, yCol] = addedFile.col.split(',').map((c) => parseInt(c))
            const file = addedFile.files.find((f) => f.includes(filename))
            // let [xVal, y] = [[], []]
            const contents = await fs.readTextFile(file)

            const lines = contents
                .split('\n')
                .filter((l) => l.length > 0 && !l.startsWith('#'))
                .map((l) => l.trim())

            let final_lines = []
            switch (addedFile.sep) {
                case 'tab':
                    final_lines = lines.map((l) => l.split('\t'))
                    break

                case 'space':
                    final_lines = lines.map((l) => l.split(' '))
                    break

                case 'comma':
                    final_lines = lines.map((l) => l.split(','))
                    break

                default:
                    break
            }
            // console.log({ final_lines })
            final_lines.forEach((l) => {
                x.push(parseFloat(l[xCol]))
                y.push(parseFloat(l[yCol]) * addedFile.scale)
            })
        }

        const fileInd = fileChecked.get(uniqueID).findIndex((f) => f === filename)
        const color = filename === 'average' ? 'black' : `rgb(${colors[fileInd]})`

        const found_peaks = find_peaks({
            data: { x, y },
            plotID: graphDiv,
            windowWidth: felix_peak_detection.get(uniqueID).window,
            threshold: felix_peak_detection.get(uniqueID).threshold,
            color,
        })
        if (!found_peaks) return window.createToast('No peaks found', 'warning')

        const { indices } = found_peaks

        indices.forEach((i) => {
            set_peaks({ uniqueID, x: x[i], y: y[i], color })
        })

        if (toast) {
            window.createToast(
                `${indices.length} peaks found. Adjust threshold and peak width to re-calibrate peak finder`,
                'success',
                { duration: 5000, position: 'bottom-left' }
            )
        }
    } catch (error) {
        window.handleError(error)
    }
}
