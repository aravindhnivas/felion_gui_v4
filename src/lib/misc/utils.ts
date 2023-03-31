
export function getInfoContents(fileContents: string) {

    const infoContents = fileContents
        .split('\n')
        .filter((line) => line.includes('#'))
        .map((line) => line.trim())
    
    const fileVariableComputedValues: {[name: string]: number} = {}
    
    infoContents.forEach((line) => {
        const processedLine = line
            .split('\t')
            .filter((ln) => ln.length)
            .map((ln) => ln.split('#')[1]?.trim())

        if (!processedLine[2] && !processedLine[3]) return
        fileVariableComputedValues[processedLine[2]] = +processedLine[3]
    })
    return fileVariableComputedValues
}


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

export const find_peaks = ({data, plotID = null, windowWidth=4, threshold=1, color = 'black'}) => {
    if(!data) return

    const indices = detectPeaks({
        data: data.y,
        windowWidth,
        threshold,
    })

    if (indices.length < 1) return

    const shapes: Partial<Plotly.Shape>[] = indices.map((i) => {
        const x = data.x[i]
        const y = data.y[i]

        return {
            type: 'line',
            x0: x,
            y0: y,
            x1: x,
            y1: 1,
            line: {
                color: color ?? 'black',
                width: 1,
                dash: 'dashdot',
                editable: false,
            },
        }
    })

    const peaks = {
        x: indices.map((i) => data.x[i]),
        y: indices.map((i) => data.y[i]),
    }

    if(plotID) {
        console.log(`Setting shapes for ${plotID}`)
        relayout(plotID, { shapes })
        console.log(`done setting shapes for ${plotID}`)
    }

    return {indices, peaks, shapes}
}