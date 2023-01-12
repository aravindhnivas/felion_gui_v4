<script context="module">
    import { create_logger_store } from '../utils/stores'
    export const LOGGER = create_logger_store([])
</script>

<script>
    import { currentTab } from '$lib/pyserver/stores'
    import { OutputBox } from '$src/components/'
</script>

<div id="console-log-main" class="animate__animated animate__fadeIn" class:hide={$currentTab !== 'Console'}>
    <h1>Console</h1>
    <hr style="width: 100%;" />
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
