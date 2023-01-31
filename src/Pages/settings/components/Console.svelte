<script lang="ts">
    import { LOGGER } from '../utils/stores'
    import { currentTab } from '$lib/pyserver/stores'
    import { OutputBox } from '$src/components/'
</script>

<div id="console-log-main" class="animate__animated animate__fadeIn" class:hide={$currentTab !== 'Console'}>
    <OutputBox output={$LOGGER} heading="console logs" testMode={true} />
</div>

<style>
    #console-log-main {
        display: grid;
        grid-template-rows: auto auto 1fr;
        height: 100%;
        overflow: hidden;
    }
</style>
