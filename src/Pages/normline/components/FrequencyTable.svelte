<script lang="ts">
    import {
        dataTable,
        dataTable_avg,
        frequencyDatas,
        fitted_data,
        felixopoLocation,
        normMethod,
    } from '../functions/svelteWritables'

    import { STable } from '$src/components'
    // export let normMethod: string

    const uniqueID = getContext<string>('uniqueID')
    $: if ($fitted_data?.[uniqueID]?.[$normMethod[uniqueID]]) {
        $frequencyDatas[uniqueID] = $fitted_data[uniqueID][$normMethod[uniqueID]]
    }

    function tableCleanup() {
        $fitted_data[uniqueID] = {}
        $frequencyDatas[uniqueID] = []
        $dataTable[uniqueID] = []
        $dataTable_avg[uniqueID] = []
    }
    const rowKeys = ['name', 'freq', 'amp', 'fwhm', 'sig']
    const headKeys = ['Filename', 'Frequency', 'Intensity', 'FWHM', 'Sigma']

    let felixOpoDatLocation: string = ''
    const update_loc = async (loc: string) => {
        felixOpoDatLocation = await path.resolve(loc, '../EXPORT')
    }
    $: update_loc($felixopoLocation[uniqueID])
    onMount(() => {
        frequencyDatas.init(uniqueID)
        fitted_data.init(uniqueID)
        dataTable.init(uniqueID)
        dataTable_avg.init(uniqueID)
        return () => {
            frequencyDatas.remove(uniqueID)
            fitted_data.remove(uniqueID)
            dataTable.remove(uniqueID)
            dataTable_avg.remove(uniqueID)
        }
    })
</script>

<div class="notice__div">Frequency table</div>
<STable
    rows={$frequencyDatas[uniqueID]}
    {rowKeys}
    {headKeys}
    closeableRows={true}
    on:tableCleared={tableCleanup}
    sortable={true}
    configDir={felixOpoDatLocation}
    options_filter=".felix.table.json"
/>
