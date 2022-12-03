<script lang="ts">
    import { slide } from 'svelte/transition'
    import Textfield from '@smui/textfield'
    import MenuSurface from '@smui/menu-surface'
    import IconSwitch from '$components/IconSwitch.svelte'
    import VirtualCheckList from '$components/VirtualCheckList.svelte'
    import { path, fs } from '@tauri-apps/api'
    export let filetype = '*.*'
    export let markedFile = ''
    export let fileChecked = []
    export let fullfileslist: string[] = []
    export let currentLocation = ''

    const dispatch = createEventDispatcher()
    let searchSurface = null
    let fullfiles: { name: string; id: string }[] = []
    let selectAll = false
    let otherfolders: { name: string; id: string }[] = []
    let original_files = []
    const uniqueID = getContext('uniqueID')

    const saveLocationToDB = getContext('saveLocationToDB')
    let searchKey = ''
    const searchfile = () => {
        console.log(searchKey)
        if (!searchKey) {
            fullfiles = original_files
        } else {
            fullfiles = original_files.filter((file) => file.name.includes(searchKey))
        }
    }
    let filesLoaded = false

    async function getfiles(loc: string, toast = false, keepfiles = false) {
        if (!(await fs.exists(loc))) {
            // reject("Location doesn't exist: Browse files again")
            if (!toast) return Promise.reject("Location doesn't exist: Browse files again")
            window.createToast('Location undefined', 'danger')
            return Promise.reject("Location doesn't exist: Browse files again")
        }

        original_files = otherfolders = fullfiles = []
        if (!keepfiles) {
            fileChecked = []
        }
        selectAll = false
        filesLoaded = false

        // try {
        const folderfile = await tryF(fs.readDir(loc))
        if (isError(folderfile)) {
            throw folderfile
        }
        // console.log(folderfile)

        const fileIncludePattern = new RegExp(`.+\\.[^fr]?${filetype}`) // f or r keyword is to avoid getting fscan and rscan files

        original_files = fullfiles = folderfile
            .filter((file) => fileIncludePattern.test(file.name))
            .map((file) => ({ name: file.name, id: window.getID() }))
            .sort((a, b) => (a.name < b.name ? 1 : -1))

        fullfileslist = fullfiles.map((file) => file.name)
        otherfolders = folderfile
            .filter((file) => Object.hasOwn(file, 'children'))
            .map((file) => ({ name: file.name, id: window.getID() }))
            .sort((a, b) => (a.name > b.name ? 1 : -1))

        console.log('Folder updated')

        dispatch('chdir', {
            action: 'chdir',
            filetype,
            loc,
            fullfileslist,
        })

        if (saveLocationToDB && filetype.length > 2) {
            localStorage.setItem(`${filetype}_location`, loc)
        }
        filesLoaded = true

        return fullfiles
    }

    let sortFile = false
    $: sortFile
        ? (fullfiles = fullfiles.sort((a, b) => (a.name > b.name ? 1 : -1)))
        : (fullfiles = fullfiles.sort((a, b) => (a.name < b.name ? 1 : -1)))

    const changeDirectory = async (goto) => {
        currentLocation = await path.resolve(currentLocation, goto)
    }

    $: if (currentLocation) {
        fileChecked = []
    }

    const get_marked_file = (e) => {
        selectAll = false
        if (!(e.ctrlKey && filetype.includes('felix'))) return
        const filename = e.target.value
        markedFile = markedFile === filename ? '' : filename
        dispatch('markedFile', { markedFile })
    }

    $: fileSelected = fileChecked
</script>

<div class="top__div px-2">
    <i role="presentation" class="material-symbols-outlined" on:click={() => changeDirectory('..')}>arrow_back</i>
    <i
        role="presentation"
        class="material-symbols-outlined animate__animated animate__faster"
        on:animationend={({ currentTarget }) => currentTarget.classList.remove('animate__rotateIn')}
        on:click={({ currentTarget }) => {
            currentTarget.classList.add('animate__rotateIn')
            currentLocation = currentLocation
        }}>refresh</i
    >
    <IconSwitch bind:toggler={sortFile} icons={['trending_up', 'trending_down']} />
    <div class="ml-auto">
        <span
            role="presentation"
            class="material-symbols-outlined"
            on:click={() => {
                selectAll = !selectAll
                console.log('selected all files')
                selectAll ? (fileChecked = fullfiles.map((file) => file.name)) : (fileChecked = [])
            }}
        >
            {selectAll ? 'remove_done' : 'select_all'}
        </span>
        <i
            role="presentation"
            class="material-symbols-outlined"
            on:click={() => {
                searchSurface.setOpen(true)
            }}>search</i
        >
    </div>
    <MenuSurface
        style="background: var(--background-color);"
        bind:this={searchSurface}
        anchorCorner="TOP_LEFT"
        anchorMargin={{ top: 0, right: 50, bottom: 0, left: 0 }}
    >
        <div class="p-2">
            <Textfield on:keyup={searchfile} bind:value={searchKey} label="Search {filetype} files" />
        </div>
    </MenuSurface>
</div>

<div
    class="main__container"
    id="{uniqueID}-{filetype}_filebrowser"
    style:grid-template-rows={fullfiles.length
        ? otherfolders.length
            ? 'auto 6fr 1fr'
            : 'auto 1fr'
        : otherfolders.length
        ? 'auto auto 1fr'
        : 'auto 1fr'}
>
    <div class="file-dir">
        <i class="material-symbols-outlined">keyboard_arrow_right</i>
        <div class="folder_name__div">
            <!-- {#if currentLocation} -->
            {#await path.basename(currentLocation) then name}
                <div>{name}</div>
            {:catch _}
                <div>undefined</div>
            {/await}
            <!-- {/if} -->
            {#if searchKey}
                <div class="tag is-small is-warning">{searchKey}</div>
                <button
                    class="button tag is-danger"
                    on:click={() => {
                        searchKey = ''
                        searchfile()
                    }}>X</button
                >
            {/if}
        </div>
    </div>

    {#await getfiles(currentLocation)}
        <div class="mdc-typography--subtitle1 align center">...loading</div>
    {:then fullfiles}
        {#if fullfiles.length}
            <VirtualCheckList
                on:fileselect
                bind:fileChecked
                {fileSelected}
                items={fullfiles}
                {markedFile}
                on:click={get_marked_file}
            />
        {:else if fullfiles.length <= 0}
            <div>No {filetype} here! or try reload files</div>
        {/if}
        {#if otherfolders.length}
            <div style="overflow-y: auto;">
                {#each otherfolders as folder (folder.id)}
                    <div
                        role="presentation"
                        class="align"
                        on:click={() => changeDirectory(folder.name)}
                        transition:slide|local
                    >
                        <i role="presentation" class="material-symbols-outlined">keyboard_arrow_right</i>
                        <div class="mdc-typography--subtitle1" style="cursor: pointer;">{folder.name}</div>
                    </div>
                {/each}
            </div>
        {/if}
    {:catch error}
        <div>{error}</div>
    {/await}
</div>

<style>
    .top__div {
        display: flex;
        align-items: center;
        background-color: #634e96;
        border-radius: 1em;
        margin-bottom: 1em;
    }
    .main__container {
        width: 100%;
        display: grid;
        grid-auto-flow: row;
        overflow-y: hidden;
        gap: 0.1em;
    }
    .file-dir {
        display: grid;
        gap: 0.5em;
        grid-template-columns: auto 1fr;
    }
    .folder_name__div {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.1em;
    }
</style>
