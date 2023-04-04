import { subplot, plot } from '../../../js/functions'
import { plotlySelection, plotlyClick } from './misc'
import beforePlot from './beforePlot'
import { felix_fulldata, OPO_fulldata, graphPlotted } from './svelteWritables'

export async function felix_opo_func({
    uniqueID,
    mode,
}: {
    uniqueID: string
    mode: 'felix' | 'opo'
}) {


    let baseGraphDiv: string
    let graphDiv: string

    if (mode === 'felix') {
        graphDiv = `${uniqueID}-avgplot`
        baseGraphDiv = `${uniqueID}-bplot`
    } else if (mode === 'opo') {
        graphDiv = `${uniqueID}-opoRelPlot`
        baseGraphDiv = `${uniqueID}-opoplot`
    }
    const status = await beforePlot({
        graphDiv,
        baseGraphDiv,
        uniqueID,
    })

    if (!status) return console.warn('No data to plot')

    if (mode === 'felix') {
        if (felix_fulldata.get(uniqueID)['SA'] && felix_fulldata.get(uniqueID)['pow']) {
            subplot(
                'Spectrum and Power Analyser',
                'Wavelength set (cm-1)',
                'SA (cm-1)',
                felix_fulldata.get(uniqueID)['SA'],
                `${uniqueID}-saPlot`,
                'Wavelength (cm-1)',
                'Total Power (mJ)',
                felix_fulldata.get(uniqueID)['pow']
            )
        }

        console.log('Graph Plotted')
    } else if (mode === 'opo') {
        plot(
            'OPO Calibration',
            'Set Wavenumber (cm-1)',
            'Measured Wavenumber (cm-1)',
            OPO_fulldata.get(uniqueID)['SA'],
            `${uniqueID}-opoSA`
        )
    }

    const currentGraphDiv = document.getElementById(graphDiv)
    graphPlotted.setValue(uniqueID, true)
    // const event = new CustomEvent('plotted', { bubbles: false, detail: { graphDiv } })
    // currentGraphDiv.dispatchEvent(event)

    if (currentGraphDiv.hasAttribute('data-plotly-event-created')) return

    const plotDetails = { graphDiv, mode, uniqueID }
    currentGraphDiv.setAttribute('data-plotly-event-created', 'true')

    plotlySelection(plotDetails)
    plotlyClick(plotDetails)
}
