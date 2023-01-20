<script lang="ts">
    import { Textfield } from '$src/components'
    import IconButton, { Icon } from '@smui/icon-button'
    import Icon_unlock from 'virtual:icons/mdi/lock-off'
    import Icon_lock from 'virtual:icons/mdi/lock'
    import IconRefresh from 'virtual:icons/mdi/refresh'
    export let value: string | number = ''
    export let label: string = ''
    export let browseBtn: boolean = true
    export let dir: boolean = true
    export let filetype: string = ''
    export let lock: boolean | null = null
    export let type: string = 'text'
    export let updateMode: boolean | null = null
    export let style: string = ''

    let className: string = ''
    export { className as class }

    // console.warn(mdiIcons)
    const dispatch = createEventDispatcher()
    const update = async (e: { currentTarget: HTMLElement }) => {
        e.currentTarget.classList.add('animate__rotateIn')
        dispatch('update')
    }

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

        // console.log(value)
        dispatch('fileupdate', result)
    }
</script>

<div class={className} {style}>
    {#if browseBtn}
        <button disabled={lock ?? false} class="button is-link" on:click={browse_folder}>Browse</button>
    {/if}
    <Textfield disabled={lock ?? false} bind:value {label} {type} />
    {#if updateMode !== null}
        <div
            role="presentation"
            class="animate__animated animate__faster"
            on:animationend={({ currentTarget }) => {
                currentTarget.classList.remove('animate__rotateIn')
            }}
            on:click={update}
        >
            <IconRefresh />
        </div>
    {/if}

    {#if lock !== null}
        <IconButton toggle bind:pressed={lock}>
            <Icon><Icon_unlock /></Icon>
            <Icon on><Icon_lock /></Icon>
        </IconButton>
    {/if}
    <slot />
</div>
