<script lang="ts">
    import { fit_config_filename } from '$src/Pages/timescan/stores'
    import { Textfield, Switch, TextAndSelectOptsToggler } from '$src/components'

    export let configDir = ''
    export let initialValues = ''
    export let defaultInitialValues = true
</script>

<div class="align h-center">
    <Switch bind:selected={defaultInitialValues} label="default" />
    <Textfield bind:value={initialValues} label="initialValues" />
    <TextAndSelectOptsToggler
        bind:value={$fit_config_filename}
        label="fit-config file (*.fit.json)"
        lookFor=".fit.json"
        lookIn={configDir}
    />
</div>
