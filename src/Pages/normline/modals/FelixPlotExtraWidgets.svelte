<script>
    import { Textfield, Modal } from '$src/components'
    export let active = false
    export let extraWidget = { label: '', value: '', step: '' }
    export let widgetType = 'text'
    const dispatch = createEventDispatcher()
</script>

{#if active}
    <Modal bind:active title="Add widget">
        <div slot="content" style="display: grid; place-items: center;">
            <Textfield
                style="width:12em; margin-bottom:1em;"
                variant="outlined"
                type="text"
                bind:value={extraWidget.label}
                label="label"
            />
            <Textfield
                style="width:12em; margin-bottom:1em;"
                variant="outlined"
                type={widgetType}
                bind:value={extraWidget.value}
                label="value"
            />
            {#if widgetType === 'number'}
                <Textfield
                    style="width:12em; margin-bottom:1em;"
                    variant="outlined"
                    type="number"
                    bind:value={extraWidget.step}
                    label="step"
                />
            {/if}
        </div>
        <button
            slot="footerbtn"
            class="button is-link"
            on:click={() => {
                dispatch('widgetadded')
            }}>Submit</button
        >
    </Modal>
{/if}
