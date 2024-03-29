<script lang="ts">
    import { collisionalCoefficient } from '../stores/collisional'
    import { collisionalTemp } from '../stores/common'
    import { polynomial } from 'regression'
    import { Textfield, Checkbox, SeparateWindow } from '$src/components'
    import colors from '$lib/misc/colors'
    import { react } from 'plotly.js-basic-dist'
    import type WinBox from 'winbox'

    export let active = false
    export let collisionalFilename = ''

    let graphWindow: WinBox
    let windowReady = false

    $: if (windowReady) {
        setTimeout(() => graphWindow?.focus(), 100)
    }

    function linspace(start: number, stop: number, num: number, endpoint = true) {
        const div = endpoint ? num - 1 : num
        const step = (stop - start) / div
        return Array.from({ length: num }, (_, i) => start + step * i)
    }

    let originalRateConstants: { x: number[]; y: number[]; name: string }[] = []
    let givenTemperature: number[] = []
    let tempIndex = 0
    async function readCollisionalDataFromFile() {
        if (!(await fs.exists(collisionalFilename)))
            return window.handleError(`File not found : ${collisionalFilename}`)

        const [_err, fileContents] = await oO(fs.readTextFile(collisionalFilename))
        if (_err) return null

        const data = fileContents
            .split('\n')
            .filter((line) => !line.includes('#') && line.trim().length)
            .filter((line) => line.trim().split('\n'))

        console.log({ data })

        givenTemperature = data[0].split('\t').map((temp) => parseFloat(temp))

        tempIndex ||= givenTemperature.length
        givenTemperature = givenTemperature.slice(0, tempIndex)
        console.log({ givenTemperature })

        const rateConstantsRawData = data.slice(1)
        originalRateConstants = []

        rateConstantsRawData.forEach((currentRate) => {
            const rateArr = currentRate
                .trim()
                .split('\t')
                .map((r) => r.trim())
            const [i, j] = [rateArr[0], rateArr[1]]
            const label = `${i} --> ${j}`

            const currentRequiredRateData = rateArr.slice(2, 2 + givenTemperature.length).map((r) => parseFloat(r))

            const addData = {
                x: givenTemperature,
                y: currentRequiredRateData,
                name: label,
            }

            originalRateConstants = [...originalRateConstants, addData]
        })
        rescaleData()
        return
    }

    let polyOrder = 2
    const layout: Partial<Plotly.Layout> = {
        title: 'Rate constants',
        yaxis: { title: 'Rate constants (cm3 molecules-1 s-1)' },
        xaxis: { title: 'Temperature (K)' },
        hovermode: 'closest',
        autosize: true,
        height: 450,
    }

    let dataToPlot: PlotData[] = []
    let scaleRateConstant = '1e12'

    const rescaleData = () => {
        if (!originalRateConstants.length) return
        console.log('Plotting data')
        console.log(originalRateConstants.length)
        dataToPlot = []
        dataToPlot = originalRateConstants.map((rateObj, i) => {
            const { name, x, y } = rateObj
            const newY = y.map((value) => (value *= parseFloat(scaleRateConstant)))
            return {
                name,
                x,
                y: newY,
                mode: 'markers',
                line: { color: `rgb${colors[i]}` },
                legendgroup: `group${i}`,
            }
        })
        react('rateConstantsPlot', dataToPlot, layout)
    }

    const fitDataFunction = () => {
        $collisionalCoefficient = []

        const fittedTemp = linspace(givenTemperature[0], givenTemperature.at(-1), 100)

        const fitData = dataToPlot.map((dataObj) => {
            const arr = [dataObj.x, dataObj.y]
            const tranposedArr = arr[0].map((_, colIndex) => arr.map((row) => row[colIndex]))

            const { equation } = polynomial(tranposedArr, {
                order: polyOrder,
            })

            const currentCollisionalRateConstant = equation
                .map((coeff, index) => {
                    const powerOrder = polyOrder - index
                    return coeff * $collisionalTemp ** powerOrder
                })
                .reduce((a, b) => a + b)

            console.log(
                { currentCollisionalRateConstant },
                currentCollisionalRateConstant / parseFloat(scaleRateConstant)
            )
            $collisionalCoefficient = [
                ...$collisionalCoefficient,
                {
                    label: dataObj.name,
                    value: (currentCollisionalRateConstant / parseFloat(scaleRateConstant)).toExponential(2),
                    id: window.getID(),
                },
            ]

            const fittedRateConstant = fittedTemp.map((x) => {
                return equation
                    .map((coeff, index) => {
                        const powerOrder = polyOrder - index
                        return coeff * x ** powerOrder
                    })
                    .reduce((a, b) => a + b)
            })
            const { name, line, legendgroup } = dataObj

            return {
                name,
                line,
                legendgroup,
                x: fittedTemp,
                y: fittedRateConstant,
                mode: 'lines',
            }
        })
        // console.log({ $collisionalCoefficient })
        // console.log({ fitData, dataToPlot })
        react('rateConstantsPlot', [...dataToPlot, ...fitData], layout)
    }

    let autoCompute = false

    $: if ($collisionalTemp && autoCompute) {
        readCollisionalDataFromFile()
        fitDataFunction()
    }
</script>

<SeparateWindow title="rateConstantsPlot" bind:active bind:windowReady bind:graphWindow maximize={false}>
    <svelte:fragment slot="header_content__slot">
        <div class="header">
            <Textfield
                bind:value={scaleRateConstant}
                label="ScaleY"
                on:keyup={({ key }) => {
                    if (key == 'Enter') {
                        rescaleData()
                    }
                }}
            />
            <Textfield
                bind:value={polyOrder}
                label="polyOrder"
                input$type="number"
                on:keyup={({ key }) => {
                    if (key == 'Enter') {
                        fitDataFunction()
                    }
                }}
            />
            <Textfield bind:value={tempIndex} label="Temperature Index" />
            <button
                class="button is-link"
                on:click={async () => {
                    await readCollisionalDataFromFile()
                }}>Read data</button
            >
            <button class="button is-link" on:click={rescaleData}>Rescale Data</button>
            <Textfield bind:value={$collisionalTemp} label="collisionalTemp" />
            <button class="button is-link" on:click={fitDataFunction}>Fit Data</button>
            <Checkbox bind:value={autoCompute} label="autoCompute" />
        </div>
    </svelte:fragment>

    <svelte:fragment slot="main_content__slot">
        <div id="rateConstantsPlot" />
    </svelte:fragment>
</SeparateWindow>

<style>
    .header {
        display: flex;
        gap: 1em;
        align-items: center;
    }
</style>
