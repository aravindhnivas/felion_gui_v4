<script lang="ts">
    import { Textfield } from '$src/components'
    import IconButton, { Icon } from '@smui/icon-button'

    export let dir: boolean = true
    export let value: string | number | string[] = dir ? '' : []
    export let label: string = ''
    export let browseBtn: boolean = true
    export let filetype: string = ''
    export let lock: boolean | null = null
    export let type: string | number = 'text'
    export let style: string = ''

    let className: string = ''
    export { className as class }
    export let folder_icon = true

    const dispatch = createEventDispatcher()

    const browse_folder = async () => {
        let filter = []
        if (filetype) {
            filter = [{ name: filetype, extensions: [filetype] }]
        }
        const result = await dialog.open({
            directory: dir,
            filters: [...filter, { name: 'All files', extensions: ['*.*'] }],
            multiple: false,
        })
        if (!result) return
        if (typeof result === 'string') {
            value = result
        } else {
            value = result[0]
        }

        dispatch('fileupdate', result)
    }
</script>

<div class={className} {style} {...$$restProps}>
    {#if browseBtn}
        <button disabled={lock ?? false} class="button is-link" on:click={browse_folder}>Browse</button>
    {/if}
    <Textfield disabled={lock ?? false} bind:value {label} input$type={type} on:change />
    {#if folder_icon}
        <button
            class="i-material-symbols-folder-open-outline"
            on:click={async () => {
                if (typeof value !== 'string') return window.createToast(`Invalid path`, 'danger')
                if (!(await fs.exists(value))) return window.createToast(`Directory does not exist`, 'danger')
                await shell.open(value)
            }}
        />
    {/if}

    {#if lock !== null}
        <IconButton toggle bind:pressed={lock}>
            <Icon><div class="i-mdi-lock-open-outline text-sm" /></Icon>
            <Icon on><div class="i-mdi-lock text-sm" /></Icon>
        </IconButton>
    {/if}
    <slot />
</div>
