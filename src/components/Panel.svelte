<script lang="ts">
    import { Panel, Header, Content } from '@smui-extra/accordion'
    import IconButton, { Icon } from '@smui/icon-button'

    export let open = false
    export let label: string = 'label'
    export let style: string = ''

    let className: string = ''
    export { className as class }
    export let loaded: boolean = true
</script>

<Panel bind:open style="background: var(--color-primary-light);">
    <Header>
        <div class="align">
            <IconButton pressed={loaded}>
                <Icon><div class="i-mdi-sync-problem text-sm" /></Icon>
                <Icon on><div class="i-mdi-done text-sm" /></Icon>
            </IconButton>
            {label}
        </div>
        <IconButton slot="icon" toggle pressed={open}>
            <Icon on><div class="i-mdi-expand-more text-sm" /></Icon>
            <Icon><div class="i-mdi-expand-less text-sm" /></Icon>
        </IconButton>
    </Header>
    <Content class={className} style="{style}; border-top: solid 1px;">
        <slot />
    </Content>
</Panel>
