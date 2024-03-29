<script lang="ts">
    // import { tick, onDestroy } from 'svelte'
    import WinBox from 'winbox/src/js/winbox.js'
    import { Checkbox, Textfield } from '$src/components'
    // import { relayout } from 'plotly.js-basic-dist'

    export let id = window.getID()
    export let title = 'Title'
    export let active = false
    export let top = 50
    export let bottom = 50

    export let width = '70%'
    export let height = '70%'
    export let x = 'center'
    export let y = 'center'
    export let background = '#634e96'
    export let graphWindow: WinBox = null
    export let windowReady = false
    export let maximize = true
    export let graphMode = true
    export let autoHide = true
    // export let onCloseFn = null
    export let mainContent$style = 'overflow: auto; padding: 0 1em 1em 1em;'

    const dispatch = createEventDispatcher()

    async function openGraph() {
        await tick()
        graphWindow = new WinBox({
            root: document.getElementById('pageContainer'),
            mount: document.getElementById(id),
            title,
            x,
            y,
            width,
            height,
            top,
            bottom,
            background,
            onclose: function () {
                active = false
                windowReady = false
                dispatch('close')

                // const fn_type = onCloseFn.constructor.name
                // if (!onCloseFn) return false
                // if (fn_type === 'AsyncFunction') {
                //     onCloseFn().then(() => {
                //         console.log('onCloseFn finished')
                //     })
                // } else {
                //     onCloseFn()
                // }
                return false
            },
            onfocus: function () {
                windowReady = true
            },
        })
        graphWindow.maximize(maximize)
    }
    $: if (active) openGraph()

    const changeGraphDivWidth = async (ms = 0) => {
        if (!graphMode) return
        await tick()

        if (ms > 0) await sleep(ms)
        // console.log('changeGraphDivWidth', graphDivs)

        if (!graphDivs.length) lookForGraph()

        graphDivs.forEach((id) => {
            if (!id.data) return
            relayout(id, { width: graphWidth })
        })
    }

    let graphDivs = []

    function lookForGraph(node = null) {
        if (!graphMode) return
        try {
            graphDivs = Array.from(document.querySelectorAll(`#${id} .graph__div`))
            console.log('lookForGraph', graphDivs)
        } catch (error) {
            console.log('No graph in this window')
        }
    }
    let fullWidth = true

    onMount(lookForGraph)
    onDestroy(() => {
        try {
            if (active && graphWindow) {
                console.warn('Window closed')
                graphWindow.close()
            }
        } catch (error) {
            console.warn("Couldn't close the window", error)
        }
    })
    let clientWidth = 0
    let currentWidth = 700
    $: graphWidth = fullWidth ? clientWidth - 50 : currentWidth
</script>

<div {id} class="main_content__div" class:hide={autoHide && !active}>
    <div class="header_content"><slot name="header_content__slot" /></div>
    <div class="main_content" style={mainContent$style} bind:clientWidth>
        <slot name="main_content__slot" {changeGraphDivWidth} {clientWidth} />
    </div>

    {#if $$slots.footer_content__slot || $$slots.left_footer_content__slot}
        <div class="footer_content">
            <div class="container left align"><slot name="left_footer_content__slot" {changeGraphDivWidth} /></div>
            <div class="container right align">
                {#if graphMode}
                    <Checkbox bind:value={fullWidth} label="full-width" />
                    <Textfield
                        style="width: 5em;"
                        label="width"
                        bind:value={currentWidth}
                        on:change={async () => await changeGraphDivWidth(100)}
                    />

                    <button class="button is-warning" on:click={async () => await changeGraphDivWidth()}>
                        {fullWidth ? 'full-width' : 'set-width'}
                    </button>
                {/if}
                <slot name="footer_content__slot" {changeGraphDivWidth} />
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .main_content__div {
        display: grid;
        max-height: 100%;
        height: 100%;
        gap: 0.5em;
        padding: 0;
        width: 100%;
        grid-template-rows: auto 1fr auto;
        .header_content {
            display: grid;
            grid-row-gap: 0.5em;
            padding: 1em;
            &:empty {
                display: none;
            }
        }

        .footer_content {
            display: flex;
            gap: 1em;
            justify-content: flex-end;
            align-items: center;
            border-top: solid 1px;
            padding: 0.5rem;
            background-color: #8965c982;
            align-self: end;
            .right {
                justify-content: flex-end;
                flex-wrap: nowrap;
            }
            .container:empty {
                display: none;
            }
        }
    }
</style>
