<script lang="ts">
    import { Textfield, Switch, TextAndSelectOptsToggler } from '$src/components'
    export let defaultInitialValues = true
    export let initialValues = ''
    export let kinetics_fitfile = ''
    export let configDir = ''
</script>

<div class="align h-center">
    <Switch bind:selected={defaultInitialValues} label="default" />
    <Textfield bind:value={initialValues} label="initialValues" />
    <TextAndSelectOptsToggler
        bind:value={kinetics_fitfile}
        label="fit-config file (*.fit.json)"
        lookFor=".fit.json"
        lookIn={configDir}
    />
</div>
