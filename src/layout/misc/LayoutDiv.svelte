<script lang="ts">
    import LinearProgress from '@smui/linear-progress'
    export let id = window.getID()
    export let progress = 0
    export let showProgress = false
</script>

<div {id} class="main_content__div">
    <div class="header_content"><slot name="header_content__slot" /></div>
    <div class="main_content"><slot name="main_content__slot" /></div>
    <div class="footer_content">
        <div class="align">
            <div class="footer-components">
                <div class="left align"><slot name="left_footer_content__slot" /></div>
                <div class="right align"><slot name="footer_content__slot" /></div>
            </div>
            {#if showProgress && progress > 0}
                <div class="loading">
                    <LinearProgress {progress} buffer={0} />
                    <div class="progess_number__div">{Number(progress * 100).toFixed(0)}%</div>
                    <span
                        role="presentation"
                        style="cursor: pointer;"
                        class="tag is-danger"
                        on:click={() => {
                            showProgress = false
                        }}>X</span
                    >
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
    .main_content__div {
        display: grid;
        max-height: 100%;
        grid-template-rows: auto 1fr auto;
        height: 100%;
        gap: 0.5em;
        padding: 0;
        // overflow-y: auto;
        overflow: hidden;
        width: 100%;
        .header_content {
            display: grid;
            grid-row-gap: 0.5em;
        }

        .main_content {
            overflow-y: scroll;
        }

        .footer_content {
            .footer-components {
                display: flex;
                justify-content: space-around;
                width: 100%;
            }
            .loading {
                display: grid;
                width: 100%;
                grid-template-columns: 1fr auto auto;
                gap: 1em;
                justify-items: center;
                align-items: center;
                .progess_number__div {
                    border: solid 1px;
                    padding: 0 1em;
                    border-radius: 1em;
                }
            }
            display: flex;
            gap: 0.5em;
            justify-content: flex-end;
            align-items: center;
            border-top: solid 1px;
            padding: 0.5rem;
            background-color: #8965c982;
            .right {
                justify-content: flex-end;
                flex-wrap: nowrap;
                margin-right: 1rem;
            }
        }
    }
</style>
