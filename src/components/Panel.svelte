<script lang="ts">
    import { Panel, Header, Content } from '@smui-extra/accordion'

    import IconButton, { Icon } from '@smui/icon-button'
    import IconSync from 'virtual:icons/mdi/sync-problem'
    import IconDone from 'virtual:icons/mdi/done'
    import Icon_expand_less from 'virtual:icons/mdi/expand-less'
    import Icon_expand_more from 'virtual:icons/mdi/expand-more'

    export let open = false
    export let label: string = 'label'
    export let style: string = ''

    let className: string = ''
    export { className as class }
    export let loaded: boolean = true

    // $: console.log(`loaded ${loaded}: ${label}`)
</script>

<Panel bind:open style="background: var(--color-primary-light);">
    <Header>
        <div class="align">
            <IconButton pressed={loaded}>
                <Icon><IconSync /></Icon>
                <Icon on><IconDone /></Icon>
            </IconButton>
            {label}
        </div>
        <IconButton slot="icon" toggle pressed={open}>
            <Icon on><Icon_expand_less /></Icon>
            <Icon><Icon_expand_more /></Icon>
        </IconButton>
    </Header>
    <Content class={className} style="{style}; border-top: solid 1px;">
        <slot />
    </Content>
</Panel>
