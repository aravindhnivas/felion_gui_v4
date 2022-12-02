<script lang="ts">
    import Modal from '$components/modal/Modal.svelte'
    import Textfield from '@smui/textfield'
    import Select from '$src/components/Select.svelte'
    import Switch from '$src/components/Switch.svelte'
    import Notify from '$components/alert/Notify.svelte'
    import settings_key_value_infos from '$lib/configs/settings_key_value_infos.json'
    import get_files_settings_values from '$src/js/get_files_settings_values'
    import { path } from '@tauri-apps/api'
    export let currentLocation = ''
    export let fullfileslist = []
    export let fileChecked = []
    export let active = false

    const style = 'width:14em; height:3.5em; margin-right:0.5em'
    let showAllFiles = true
    let selected_file = ''
    $: displayFiles = showAllFiles ? fullfileslist : fileChecked
    let loadfilename: string = ''
    const loadfile = async (filename) => {
        loadfilename = await path.join(currentLocation, filename)
    }
    $: loadfile(selected_file)
</script>

<button
    class="button is-link"
    on:click={() => {
        active = true
    }}>GetLabviewSettings</button
>

{#if active}
    <Modal title="Labview Settings" bind:active>
        <svelte:fragment slot="body_header__div">
            <div class="controller">
                <Switch bind:selected={showAllFiles} label="show all" />
                <Select auto_init={true} bind:value={selected_file} label="Filename" options={displayFiles} />
            </div>
        </svelte:fragment>

        <svelte:fragment slot="body_scrollable__div">
            {#await get_files_settings_values(loadfilename)}
                <div class="info-box">loading...</div>
            {:then variableValues}
                <div class="container">
                    {#each Object.keys(settings_key_value_infos) as id (id)}
                        <div style:margin-bottom="2rem">
                            <h1>{id}</h1>
                            <div>
                                {#each settings_key_value_infos[id] as key}
                                    <Textfield
                                        {style}
                                        value={variableValues[key] ?? ''}
                                        label={key}
                                        type="number"
                                        disabled
                                    />
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            {:catch error}
                {#if displayFiles.length > 0 && !selected_file}
                    <Notify label="Select filename to show detail" type="warning" />
                {:else}
                    <Notify label={error} type="danger" />
                {/if}
            {/await}
        </svelte:fragment>
    </Modal>
{/if}

<style>
    .info-box {
        display: flex;
        margin-top: 1em;
        padding: 1em;
        justify-content: center;
    }
    .controller {
        display: flex;
        gap: 1em;
    }
    .container {
        display: grid;
        padding: 1em;
        height: 90%;
        overflow-y: auto;
    }
</style>
