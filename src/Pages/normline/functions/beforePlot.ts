import { felixIndex, felixOutputName, normMethod } from './svelteWritables'
import {get_fulldata } from './utils'
import { plot } from '../../../js/functions'
import { plotlayout } from './plot_labels'

export default async function beforePlot({
    graphDiv,
    baseGraphDiv,
    uniqueID,
}: {
    graphDiv: string
    baseGraphDiv: string
    uniqueID: string
}) {
    try {
        felixOutputName.setValue(uniqueID, 'averaged')
        felixIndex.setValue(uniqueID, [])

        let avgdataToPlot: DataFromPython
        let ylabel: string = ''

        if (normMethod.get(uniqueID) === 'Log') {
            avgdataToPlot = get_fulldata(uniqueID)['average']
            ylabel = 'Normalised Intensity per J'
        } else if (normMethod.get(uniqueID) == 'Relative') {
            avgdataToPlot = get_fulldata(uniqueID)['average_rel']
            ylabel = 'Relative Depletion (%)'
        } else if (normMethod.get(uniqueID) == 'IntensityPerPhoton') {
            avgdataToPlot = get_fulldata(uniqueID)['average_per_photon']
            ylabel = 'Normalised Intensity per photon'
        }

        plot('Baseline Corrected', 'Wavelength (cm-1)', 'Counts', get_fulldata(uniqueID)['base'], baseGraphDiv)

        if (!avgdataToPlot) return window.createToast('No data to plot', 'danger')
        const { yaxis, xaxis, title } = plotlayout[normMethod.get(uniqueID)]
        plot(title, xaxis.title, yaxis.title, avgdataToPlot, graphDiv)
        return Promise.resolve(true)
    } catch (error) {
        window.handleError(error)
    }
}
