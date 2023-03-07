<script lang="ts">
    import Checkbox from '@smui/checkbox'
    import FormField from '@smui/form-field'
    export let value: boolean = false
    export let label: string = ''
    export let style: string = ''
    let className: string = ''
    export { className as class }
</script>

<FormField {style} class={className}>
    <Checkbox bind:checked={value} on:change />
    <span slot="label">{label}</span>
</FormField>
