import { felixPeakTable, felixIndex, felixOutputName, felixPlotAnnotations, Ngauss_sigma, get, fitted_data, normMethod, getFileColor, getCurrentGraph } from './svelteWritables'
import { relayout } from 'plotly.js-basic-dist'
import { uniqBy } from 'lodash-es'
import { fs, path } from '@tauri-apps/api'
import { get_graphDiv } from './utils'

export async function savefile({ file = {}, name = '', location = '' } = {}) {
    const filestem = name.endsWith('.json') ? name : `${name}.json`
    const filename = await path.join(location, filestem)
    const result = await fs.writeTextFile(filename, JSON.stringify({ file }, null, 4))
    if (isError(result)) {
        return window.handleError(result)
    }
    window.createToast(`${name}.json has been saved.`, 'success')
}

export async function loadfile(name, location) {
    const filestem = name.endsWith('.json') ? name : `${name}.json`
    const filename = await path.join(location, filestem)
    if (!(await fs.exists(filename))) {
        window.createToast(`Invalid file: ${name}.json .`, 'danger')
        return []
    }

    const content = await fs.readTextFile(filename)
    const getdata: { file: { [name: string]: string; id: string }[] } = tryF(() => JSON.parse(content))

    if (isError(getdata)) {
        window.handleError(getdata)
        return []
    }

    const loadedfile = getdata?.file?.map((arr) => ({ ...arr, id: window.getID() })) || []
    window.createToast(`${name}.json has been loaded.`, 'success')

    return loadedfile
}

export function plotlySelection({ graphDiv, uniqueID }) {
    const graph = document.getElementById(graphDiv)
    console.warn('Creating plotly selection events for, ', graphDiv)

    graph.on('plotly_selected', (data) => {
        try {
            console.log(data)
            // mode === 'felix' ? opoMode.setValue(uniqueID, false) : opoMode.setValue(uniqueID, true)

            const { range } = data
            felixIndex.setValue(uniqueID, range.x)
            console.warn('felixIndex', get(felixIndex))

            let outputName = data.points[0]?.data?.name
            outputName = outputName.split('(')[0].split('.')[0]
            felixOutputName.setValue(uniqueID, outputName)
            // console.log('felixOutputName', felixOutputName.get(uniqueID))
        } catch (error) {
            console.log('No data available to fit')
        }
    })
}

export const set_peaks = ({ graphDiv = null, uniqueID, x, y, color='black', add_annotation = true}) => {

    const freq = x.toFixed(1)
    const amp = y.toFixed(1)
    const currentPeaks = { freq, amp, sig: Ngauss_sigma.get(uniqueID), id: window.getID() }

    felixPeakTable.update((data) => {
        data[uniqueID] = uniqBy([...data[uniqueID], currentPeaks], 'freq')
        return data
    })

    if(!add_annotation) return

    const annotation = {
        text: `(${freq}, ${amp})`,
        x,
        y,
        font: { color },
        arrowcolor: color,
    }

    felixPlotAnnotations.update((data) => {
        data[uniqueID] = uniqBy([...data[uniqueID], annotation], 'text')
        return data
    })

    relayout(graphDiv ?? get_graphDiv(uniqueID).graphDiv, {
        annotations: felixPlotAnnotations.get(uniqueID),
    })
    
}

export function plotlyClick({ graphDiv, uniqueID }: { graphDiv: string; uniqueID: string }) {
    const graph = document.getElementById(graphDiv)
    console.warn('Creating plotly click events for, ', graphDiv)

    graph.on('plotly_click', (data) => {
        console.log('Graph clicked: ', data)

        if (data.event.ctrlKey) {
            console.log('Data point length: ', data.points.length)

            for (let i = 0; i < data.points.length; i++) {
                console.log('Running cycle: ', i)

                let d = data.points[i]
                let name = d.data.name

                const outputName = felixOutputName.get(uniqueID)
                console.log('felixOutputName', outputName)
                console.log(name, outputName)
                if (!name.includes(outputName)) {
                    return window.createToast('Change output filename.', 'danger')
                }
                const { color } = d.data?.line
                set_peaks({graphDiv, uniqueID, x: d.x, y: d.y, color})
            }
        }
    })
}

export function relayout_fitted_data(uniqueID) {
    console.log({fitted_data: fitted_data.get(uniqueID)})

    const current_method = normMethod.get(uniqueID)
    const currentData = fitted_data.get(uniqueID)[current_method]

    const hlines: Partial<Plotly.Shape>[] = currentData.map((d) => {
        const freq = parseFloat(d.freq.split('±')[0])
        const amp = parseFloat(d.amp.split('±')[0])
        if(isNaN(freq) || isNaN(amp)) return
        
        return {
            type: 'line',
            x0: freq,
            y0: amp,
            x1: freq,
            y1: 0,
            line: {
                color: getFileColor(uniqueID),
                width: 2,
                dash: "dashdot",
                editable: false,
            },
        }
    })

    const vlines: Partial<Plotly.Shape>[] = currentData.map((d) => {
        const freq = parseFloat(d.freq.split('±')[0])
        const amp = parseFloat(d.amp.split('±')[0])
        const fwhm = parseFloat(d.fwhm.split('±')[0])
        if(isNaN(freq) || isNaN(amp) || isNaN(fwhm)) return
        
        return {
            type: 'line',
            x0: freq-(fwhm/2),
            y0: amp/2,
            x1: freq+(fwhm/2),
            y1: amp/2,
            line: {
                color: getFileColor(uniqueID),
                width: 2,
                dash: "dashdot",
                editable: false,
            },
        }
    })

    const shapes = [...hlines, ...vlines]
    // const {shapes: prev_shapes} = document.getElementById(getCurrentGraph(uniqueID)).layout as Plotly.Layout
    // console.log({ shapes })
    relayout(getCurrentGraph(uniqueID), { shapes })
}