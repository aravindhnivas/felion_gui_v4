import { felix_fulldata, opoMode, OPO_fulldata, normMethod, felix_peak_detection, fileChecked, felixPeakTable, felixPlotAnnotations} from "./svelteWritables"
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

export const find_felix_opo_peaks = (uniqueID) => {
    
    const { graphDiv } = get_graphDiv(uniqueID)
    relayout(graphDiv, { annotations: [], shapes: [] })

    felixPeakTable.setValue(uniqueID, [])
    felixPlotAnnotations.setValue(uniqueID, [])
    
    const { key } = plotlayout[normMethod.get(uniqueID)]
    const filename = felix_peak_detection.get(uniqueID).filename
    const { x, y } = get_fulldata(uniqueID)[key][filename] as {x: number[], y: number[]}

    const fileInd = fileChecked.get(uniqueID).findIndex((f) => f === filename)
    const color = filename === 'average' ? 'black' : `rgb(${colors[fileInd]})`

    const {indices} = find_peaks({
        data: { x, y },
        plotID: graphDiv,
        windowWidth: felix_peak_detection.get(uniqueID).window,
        threshold: felix_peak_detection.get(uniqueID).threshold,
        color,
    })

    indices.forEach((i) => {
        set_peaks({uniqueID, x: x[i], y: y[i], color })
    })
}