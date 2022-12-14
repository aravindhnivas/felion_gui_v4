<script lang="ts">
    import { fly, fade } from 'svelte/transition'
    import Editor from '$lib/Editor.svelte'
    import { graph_detached } from '$src/js/plot'
    import { resizableDiv } from '$src/js/resizableDiv.js'
    import { IconButton, BrowseTextfield, Modal, FileBrowser } from '$src/components'

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

    // const saveLocationToDB = getContext('saveLocationToDB')
    onMount(() => {
        // if (!saveLocationToDB) return
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
                relayout(id, { width: id.clientWidth })
            } catch (error) {
                console.log('could not relayout', error)
            }
        })
    }

    setContext('lookForGraph', lookForGraph)
    setContext('changeGraphDivWidth', changeGraphDivWidth)

    let browse_location_div_toggle = true
    let files_div_toggle = true
    let button_row_div_toggle = true
    let fullscreen_toggle = false
    let reports_div_toggle = false
</script>

<section {id} style:display>
    <div class="main__layout__div" style="grid-template-columns: {files_div_toggle ? 'auto 1fr' : '1fr'}; ">
        <div
            use:resizableDiv
            style:touch-action="none"
            class="left_container__div box background-body"
            class:hide={!files_div_toggle}
            transition:fly={{ x: -100, duration: 500 }}
        >
            <FileBrowser
                on:markedFile
                on:fileselect
                bind:currentLocation
                {filetype}
                bind:fileChecked
                on:chdir
                bind:fullfileslist
            />
        </div>

        <div class="right_container__div box background-body pt-1" id="{uniqueID}__mainContainer__div">
            <div class="align" style="justify-content: end; gap: 0.2em;">
                <div class="top-row mr-auto"><slot name="toggle_row" /></div>
                <div class="tag is-link" aria-label="fullscreen" data-cooltipz-dir="bottom">
                    <IconButton
                        on:click={() => {
                            files_div_toggle = fullscreen_toggle
                            browse_location_div_toggle = fullscreen_toggle
                            button_row_div_toggle = fullscreen_toggle
                            changeGraphDivWidth()
                        }}
                        bind:value={fullscreen_toggle}
                        icons={{ on: 'fullscreen_exit', off: 'fullscreen' }}
                    />
                </div>
                <div
                    role="presentation"
                    class="tag is-link"
                    aria-label="update plot width"
                    data-cooltipz-dir="bottom"
                    on:click={() => changeGraphDivWidth()}
                >
                    <span class="material-symbols-outlined">cached</span>
                </div>
                <div class="tag is-link">
                    <IconButton
                        on:change={changeGraphDivWidth}
                        bind:value={files_div_toggle}
                        icons={{ on: 'visibility', off: 'visibility_off' }}
                    />Files
                </div>
                <div class="tag is-link">
                    <IconButton
                        bind:value={browse_location_div_toggle}
                        icons={{ on: 'visibility', off: 'visibility_off' }}
                    />Location
                </div>
                <div class="tag is-link">
                    <IconButton
                        bind:value={button_row_div_toggle}
                        icons={{ on: 'visibility', off: 'visibility_off' }}
                    />fx
                </div>
                <div class="tag is-link">
                    <IconButton
                        bind:value={reports_div_toggle}
                        icons={{ on: 'visibility', off: 'visibility_off' }}
                    />Reports
                </div>
                <span
                    role="presentation"
                    class="material-symbols-outlined"
                    on:click={() => (activateConfigModal = true)}>build</span
                >
            </div>
            {#if browse_location_div_toggle}
                <BrowseTextfield class="three_col_browse" bind:value={currentLocation} label="Current location" />
            {/if}

            <div class="button__div pr-2 py-2" class:hide={!button_row_div_toggle} id="{uniqueID}-buttonContainer">
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

        .left_container__div {
            display: grid;
            grid-template-rows: auto 1fr;
            width: 100%;
            max-width: 300px;
        }

        .left_container__div,
        .right_container__div {
            overflow: hidden;
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
        min-height: 3rem;
    }
    .top-row {
        display: flex;
        gap: 0.5em;
    }
</style>
