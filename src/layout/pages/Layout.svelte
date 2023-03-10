<script lang="ts">
    import { fade } from 'svelte/transition'
    import Editor from '$lib/Editor.svelte'
    import { graph_detached } from '$src/js/plot'
    import { BrowseTextfield, Modal, FileBrowser } from '$src/components'
    import HSplitPane from 'svelte-split-pane/src/HSplitPane.svelte'
    // import VSplitPane from 'svelte-split-pane/src/VSplitPane.svelte'

    export let id: string
    export let display = 'none'
    export let filetype = 'felix'
    export let fileChecked: string[] = []
    export let fullfileslist: string[] = []
    export let currentLocation = ''
    export let graphPlotted = false
    export let activateConfigModal = false

    const uniqueID = getContext('uniqueID')

    const dispatch = createEventDispatcher()

    onMount(() => {
        currentLocation = localStorage.getItem(`${filetype}_location`) || ''
        $graph_detached[id] = false
    })

    let graphDivContainer: HTMLElement
    let graphDivs: Plotly.PlotlyHTMLElement[] = []
    const lookForGraph = (node: HTMLElement) => {
        try {
            graphDivs = Array.from(document.querySelectorAll(`#${uniqueID}-plotContainer .graph__div`))
        } catch (error) {
            console.log(error)
        }
    }

    const changeGraphDivWidth = async (event?: CustomEvent) => {
        await tick()
        graphDivs?.forEach((id) => {
            if (!id?.on) return
            try {
                const width = id.clientWidth
                console.log('width', width)
                relayout(id, { width })
            } catch (error) {
                console.log('could not relayout', error)
            }
        })
    }

    setContext('lookForGraph', lookForGraph)
    setContext('changeGraphDivWidth', changeGraphDivWidth)

    let browse_location_div_toggle = true
    let button_row_div_toggle = true
    let fullscreen_toggle = false
    let reports_div_toggle = false

    onMount(async () => {
        const divider = document.querySelector(`#${id} .separator`)
        divider?.addEventListener('mouseup', changeGraphDivWidth)
        return () => {
            divider?.removeEventListener('mouseup', changeGraphDivWidth)
        }
    })
</script>

<section {id} style:display>
    <div class="main__layout__div">
        <HSplitPane minLeftPaneSize="10%" minRightPaneSize="40%" leftPaneSize="20%" rightPaneSize="80%">
            <left slot="left">
                <div class="left_container__div box background-body">
                    <FileBrowser
                        class="background-body"
                        on:markedFile
                        on:fileselect
                        bind:currentLocation
                        {filetype}
                        bind:fileChecked
                        on:chdir
                        bind:fullfileslist
                    />
                </div>
            </left>
            <right slot="right">
                <div class="right_container__div box background-body pt-1" id="{uniqueID}__mainContainer__div">
                    <div class="align" style="justify-content: end; gap: 0.2em;">
                        <div class="top-row mr-auto"><slot name="toggle_row" /></div>
                        <div class="tag is-link" aria-label="fullscreen" data-cooltipz-dir="bottom">
                            <button
                                class={fullscreen_toggle ? 'i-mdi-fullscreen-exit' : 'i-mdi-fullscreen'}
                                on:click={async () => {
                                    browse_location_div_toggle = fullscreen_toggle
                                    button_row_div_toggle = fullscreen_toggle
                                    await changeGraphDivWidth()
                                    fullscreen_toggle = !fullscreen_toggle
                                }}
                            />
                        </div>
                        <div class="tag is-link" aria-label="update plot width" data-cooltipz-dir="bottom">
                            <button class="i-mdi-cached" on:click={async () => await changeGraphDivWidth()} />
                        </div>

                        <div class="tag is-link">
                            <button
                                class="{browse_location_div_toggle ? 'i-mdi-visibility' : 'i-mdi-visibility-off'} mr-2"
                                on:click={() => (browse_location_div_toggle = !browse_location_div_toggle)}
                            />
                            Location
                        </div>
                        <div class="tag is-link">
                            <button
                                class="{button_row_div_toggle ? 'i-mdi-visibility' : 'i-mdi-visibility-off'} mr-2"
                                on:click={() => (button_row_div_toggle = !button_row_div_toggle)}
                            />
                            fx
                        </div>
                        <div class="tag is-link">
                            <button
                                class="{reports_div_toggle ? 'i-mdi-visibility' : 'i-mdi-visibility-off'} mr-2"
                                on:click={() => (reports_div_toggle = !reports_div_toggle)}
                            />
                            Reports
                        </div>
                        <button class="i-mdi-build" on:click={() => (activateConfigModal = true)} />
                    </div>
                    {#if browse_location_div_toggle}
                        <BrowseTextfield
                            class="three_col_browse"
                            bind:value={currentLocation}
                            label="Current location"
                        />
                    {/if}

                    <div
                        class="button__div pr-2 py-2"
                        class:hide={!button_row_div_toggle}
                        id="{uniqueID}-buttonContainer"
                    >
                        <slot name="buttonContainer" />
                    </div>

                    <div
                        class="plot__div"
                        id="{uniqueID}-plotContainer"
                        transition:fade
                        use:lookForGraph
                        bind:this={graphDivContainer}
                    >
                        <slot name="plotContainer" {lookForGraph} />
                        {#if graphPlotted}
                            <slot name="plotContainer_functions" />
                            <slot name="plotContainer_reports" />
                        {/if}

                        {#if reports_div_toggle}
                            <div class="report-editor-div" id="{uniqueID}-plotContainer-report-editor-div">
                                <Editor
                                    location={currentLocation}
                                    {filetype}
                                    id="{uniqueID}-report-editor"
                                    mount="#{uniqueID}-plotContainer-report-editor-div"
                                />
                            </div>
                        {/if}
                    </div>
                </div>
            </right>
        </HSplitPane>
        {#if activateConfigModal}
            <Modal
                on:close={() => console.log('modal closed')}
                title="{filetype.toUpperCase()} Settings"
                bind:active={activateConfigModal}
            >
                <svelte:fragment slot="content">
                    <slot name="config" />
                </svelte:fragment>

                <svelte:fragment slot="footerbtn">
                    <button
                        class="button is-link"
                        on:click={() => {
                            dispatch('configsaved', { filetype })
                        }}>Save</button
                    >
                </svelte:fragment>
            </Modal>
        {/if}
    </div>
</section>

<style lang="scss">
    section {
        height: 100%;
        overflow: hidden;
    }
    .box {
        border-radius: 0;
        margin: 0;
    }
    .main__layout__div {
        display: grid;
        grid-auto-flow: column;
        width: 100%;
        height: 100%;
        column-gap: 2em;
        overflow: hidden;

        left,
        right {
            height: 100%;
            width: 100%;
            display: flex;
        }
        .left_container__div {
            display: grid;
            grid-template-rows: auto 1fr;
            width: 100%;
            // min-width: 300px;
            // max-width: 500px;
        }

        .left_container__div,
        .right_container__div {
            overflow: hidden;
            width: 100%;
        }

        .right_container__div {
            display: grid;
            row-gap: 0.5em;
            grid-template-rows: auto auto auto 1fr;
            div:empty {
                display: none;
            }
        }
    }
    .plot__div {
        display: flex;
        row-gap: 1em;
        flex-direction: column;
        overflow: auto;
        padding-right: 1em;
        padding-bottom: 12em;
    }

    .button__div {
        display: grid;
        gap: 0.5em;
        overflow: auto;
        // min-height: 3rem;
    }
    .top-row {
        display: flex;
        gap: 0.5em;
    }
</style>
