import { plot } from '../../../js/functions'
import { normMethod } from './svelteWritables'

export function theory_func({ dataFromPython, uniqueID }) {
    let ylabel
    if (normMethod.get(uniqueID) === 'Log') {
        ylabel = 'Normalised Intensity per J'
    } else if (normMethod.get(uniqueID) === 'Relative') {
        ylabel = 'Relative Depletion (%)'
    } else {
        ylabel = 'Normalised Intensity per Photon'
    }

    let theoryData = []
    for (let x in dataFromPython['line_simulation']) {
        theoryData.push(dataFromPython['line_simulation'][x])
    }

    plot(
        'Experimental vs Theory',
        'Calibrated Wavelength (cm-1)',
        ylabel,
        [dataFromPython['averaged'], ...theoryData],
        `${uniqueID}-exp-theory-plot`
    )

    console.log('Graph Plotted')
}
