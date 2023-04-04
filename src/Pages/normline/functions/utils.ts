import { felix_fulldata, opoMode, OPO_fulldata, normMethod, felix_peak_detection, fileChecked, felixPeakTable, felixPlotAnnotations, felixOutputName} from "./svelteWritables"
import { find_peaks } from "$src/lib/misc/utils"
import { plotlayout } from "./plot_labels"
import { set_peaks } from "./misc"
import colors from "$src/lib/misc/colors"

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

export const find_felix_opo_peaks = ({uniqueID, toast = false}) => {
    try {
        const { graphDiv } = get_graphDiv(uniqueID)
        relayout(graphDiv, { annotations: [], shapes: [] })

        felixPeakTable.setValue(uniqueID, [])
        felixPlotAnnotations.setValue(uniqueID, [])
        
        const { key } = plotlayout[normMethod.get(uniqueID)]
        let filename = felixOutputName.get(uniqueID)
        filename = fileChecked.get(uniqueID).find((f) => f.includes(filename))
        if(filename === 'averaged') filename = 'average'
        console.log('Finding peaks for ', filename)
        const data = get_fulldata(uniqueID)[key][filename] as {x: number[], y: number[]}
        if(!data) return window.createToast('No data available to find peaks', 'danger')

        const { x, y } = data
        const fileInd = fileChecked.get(uniqueID).findIndex((f) => f === filename)
        const color = filename === 'average' ? 'black' : `rgb(${colors[fileInd]})`

        const found_peaks = find_peaks({
            data: { x, y },
            plotID: graphDiv,
            windowWidth: felix_peak_detection.get(uniqueID).window,
            threshold: felix_peak_detection.get(uniqueID).threshold,
            color,
        })
        if(!found_peaks) return window.createToast('No peaks found', 'warning')

        const { indices } = found_peaks

        indices.forEach((i) => {
            set_peaks({uniqueID, x: x[i], y: y[i], color })
        })

        if(toast){
            window.createToast(
                `${indices.length} peaks found. Adjust threshold and peak width to re-calibrate peak finder`, 
                'success', { duration: 5000, position: 'bottom-left'}
                )
            }
    } catch (error) {
        window.handleError(error)            
    }
}