<script>
    import { Textfield, Select } from '$src/components'
    export let value = ''
    export let label = ''
    export let toggle = false
</script>

<div aria-label={'ctrl + left click to toggle'} data-cooltipz-dir={'bottom'}>
    <svelte:component
        this={toggle ? Select : Textfield}
        on:click={(e) => {
            if (e.ctrlKey) toggle = !toggle
        }}
        on:change
        bind:value
        {label}
        {...$$restProps}
    />
</div>
