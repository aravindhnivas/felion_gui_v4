<script lang="ts">
    import { Select, Textfield } from '$src/components'

    export let active = false
</script>

<div class:hide={!active} class="main__div p-2" style="overflow: auto;">
    <h1 style="width: 100%">Search mode</h1>
    <Textfield label="search keyword" value="" />
    <Select label="field" value="" options={['']} />
</div>

<style lang="scss">
    .main__div {
        gap: 0.5em;
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
</style>
