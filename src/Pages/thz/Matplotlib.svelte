<script lang="ts">
    import Modal from '$components/modal/Modal.svelte'
    import VirtualCheckList from '$components/lists/VirtualCheckList.svelte'
    import Checkbox from '$components/Checkbox.svelte'
    // import { createEventDispatcher, onMount } from 'svelte'
    import ButtonBadge from '$components/ButtonBadge.svelte'
    import { fs, path } from '@tauri-apps/api'

    export let active = false
    export let currentLocation = ''
    let thzfiles: string[] = []

    const dispatch = createEventDispatcher()

    const update_file_config = async (_loc: string) => {
        data_location = await path.join(_loc, 'EXPORT')
    }
    $: update_file_config(currentLocation)
    let data_location = ''

    $: if (data_location) {
        thzfiles = []
        loadfiles()
    }

    let fileSelected: string[] = []
    let items: { name: string; id: string }[] = []
    let loadStatus = { name: 'loading', type: 'warning' }

    const loadfiles = async () => {
        try {
            items = []
            fileSelected = []
            thzfiles = []
            loadStatus = { name: 'loading', type: 'warning' }
            const files = await fs.readDir(data_location)
            items = files
                .map((f) => f.name)
                .filter((file) => file.endsWith('.thz.dat'))
                .map((name) => ({ name, id: window.getID() }))
            loadStatus = { name: 'loaded', type: 'success' }
        } catch (e) {
            console.log(e)
            loadStatus = { name: 'error', type: 'danger' }
        }
    }

    onMount(async () => {
        await loadfiles()
    })
    let includeFit = false
</script>

<Modal bind:active title="THz plots">
    <svelte:fragment slot="body_header__div">
        <div class="align">
            <span role="presentation" class="material-symbols-outlined" on:click={loadfiles}>refresh</span>
            <span class="tag is-{loadStatus.type}">{loadStatus.name}</span>
        </div>
    </svelte:fragment>

    <svelte:fragment slot="body_scrollable__div">
        <VirtualCheckList {items} bind:fileChecked={thzfiles} {fileSelected} ul$style={'overflow-y: auto;'} />
    </svelte:fragment>

    <svelte:fragment slot="footerbtn">
        <Checkbox bind:value={includeFit} label="includeFit" />
        <ButtonBadge
            on:click={(e) => {
                dispatch('submit', { e, args: { thzfiles, includeFit, location: data_location } })
            }}
        />
    </svelte:fragment>
</Modal>
