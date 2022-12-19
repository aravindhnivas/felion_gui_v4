<script lang="ts">
    import * as echarts from 'echarts'

    export let edata
    export let id = window.getID()

    $: console.log({ edata })
    // $: if (edata) plotIt()

    const plotIt = (node = null) => {
        const graphDiv = document.getElementById(id)
        const myChart = echarts.init(node ?? graphDiv)

        const option: echarts.EChartsOption = {
            // backgroundColor: 'whitesmoke',
            // darkMode: true,
            // title: {
            //     text: 'Mass Spectrum',
            //     left: '5%',
            // },
            tooltip: {
                trigger: 'axis',
            },
            legend: {},
            toolbox: {
                show: true,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none',
                    },
                    dataView: { readOnly: false },
                    magicType: { type: ['line', 'bar'] },
                    restore: {},
                    saveAsImage: {},
                },
                right: 10,
            },
            dataZoom: [
                {
                    type: 'inside',
                },
            ],
            xAxis: {
                type: 'value',
                name: 'm/z',
                nameLocation: 'middle',
                nameTextStyle: {
                    fontWeight: 'bolder',
                    fontSize: 20,
                    padding: 10,
                },
                data: [150, 230, 224, 218, 135, 147, 260],
            },
            yAxis: {
                name: 'Counts',
                nameLocation: 'middle',
                nameTextStyle: {
                    fontWeight: 'bolder',
                    fontSize: 20,
                    padding: 25,
                },
                type: 'value',
            },
            series: [
                {
                    data: [150, 230, 224, 218, 135, 147, 260],
                    type: 'line',
                    name: '1',
                },
                {
                    data: [15, 230, 14, 260],
                    type: 'line',
                    name: '2',
                },
            ],
        }

        option && myChart.setOption(option)
        console.log('plotted')
    }
</script>

<button class="button is-link" on:click={() => plotIt()}>PlotIt</button>
<div use:plotIt {id} class="align echart_div" />

<style>
    .echart_div {
        width: 1100px;
        height: 1000px;
        background-color: whitesmoke;
        color: black;
    }
</style>
