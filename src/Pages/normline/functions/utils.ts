import { find_peaks } from "$src/lib/misc/utils"
import { plotlayout } from "./plot_labels"
import { felix_fulldata, opoMode, OPO_fulldata, normMethod, felix_peak_detection } from "./svelteWritables"

export const get_fulldata = (uniqueID: string) => {
    const mode = opoMode.get(uniqueID)
    return mode ? OPO_fulldata.get(uniqueID) : felix_fulldata.get(uniqueID)
}

export const find_felix_opo_peaks = (uniqueID) => {
    const { key } = plotlayout[normMethod.get(uniqueID)]
    const { x, y } = get_fulldata(uniqueID)[key][felix_peak_detection.get(uniqueID).filename]

    console.log(felix_peak_detection.get(uniqueID))
    return find_peaks({
        data: { x, y },
        plotID: `${uniqueID}-avgplot`,
        windowWidth: felix_peak_detection.get(uniqueID).window,
        threshold: felix_peak_detection.get(uniqueID).threshold,
    })
}