<script lang="ts">
    import * as echarts from 'echarts'
    export let edata
    export let id = window.getID()

    $: console.log({ edata })
    $: if (edata) plotIt()
    const plotIt = (node = null) => {
        const myChart = echarts.init(node ?? id)
        const option = {
            xAxis: {
                type: 'value',
                data: [150, 230, 224, 218, 135, 147, 260],
            },
            yAxis: {
                type: 'value',
            },
            series: [
                {
                    data: [150, 230, 224, 218, 135, 147, 260],
                    type: 'line',
                },
            ],
        }

        option && myChart.setOption(option)
        console.log('plotted')
    }
</script>

<div {id} class="align echart_div">{id}</div>

<style>
    .echart_div {
        width: 1000px;
        height: 500px;
        background-color: whitesmoke;
        color: black;
    }
</style>
