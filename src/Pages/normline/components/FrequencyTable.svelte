<script lang="ts">
    import { dataTable, dataTable_avg, fitted_data, felixopoLocation, normMethod } from '../functions/svelteWritables'
    import { STable } from '$src/components'

    const uniqueID = getContext<string>('uniqueID')
    function tableCleanup() {
        $fitted_data[uniqueID] = {}
        $dataTable[uniqueID] = []
        $dataTable_avg[uniqueID] = []
    }
    const rowKeys = ['name', 'freq', 'amp', 'fwhm', 'sig']
    const headKeys = ['Filename', 'Frequency', 'Intensity', 'FWHM', 'Sigma']

    let configDir: string = ''
    $: path.resolve($felixopoLocation[uniqueID], '../EXPORT').then((res) => (configDir = res))

    onMount(() => {
        fitted_data.init(uniqueID)
        dataTable.init(uniqueID)
        dataTable_avg.init(uniqueID)
        return () => {
            fitted_data.remove(uniqueID)
            dataTable.remove(uniqueID)
            dataTable_avg.remove(uniqueID)
        }
    })
</script>

<div class="notice__div">Frequency table</div>
<STable
    rows={$fitted_data[uniqueID]?.[$normMethod[uniqueID]] ?? []}
    {rowKeys}
    {headKeys}
    closeableRows={true}
    on:tableCleared={tableCleanup}
    sortable={true}
    {configDir}
    options_filter=".felix.table.json"
/>
