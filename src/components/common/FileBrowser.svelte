<script lang="ts">
    import { slide } from 'svelte/transition'
    import { Textfield, VirtualCheckList, RefreshButtons } from '$src/components'
    import MenuSurface from '@smui/menu-surface'
    import VSplitPane from 'svelte-split-pane/src/VSplitPane.svelte'

    export let filetype = '*.*'
    export let fileChecked = []
    export let fullfileslist: string[] = []
    export let currentLocation = ''
    let className = ''
    export { className as class }

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
        // console.log(searchKey)
        if (!searchKey) {
            fullfiles = original_files
        } else {
            fullfiles = original_files.filter((file) => file.name.includes(searchKey))
        }
    }
    let filesLoaded = false

    let keepfiles = false
    async function getfiles(loc: string) {
        if (!(await fs.exists(loc))) {
            window.createToast('Location undefined', 'danger')
            return Promise.reject("Location doesn't exist: Browse files again")
        }

        original_files = otherfolders = fullfiles = []
        if (!keepfiles) {
            fileChecked = []
            keepfiles = false
        }
        selectAll = false
        filesLoaded = false

        const [_err, folderfile] = await oO(fs.readDir(loc))
        if (_err) return window.handleError(_err)

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
        // console.log('Folder updated')

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

    const sort_files = (mode: boolean) => {
        if (mode) {
            fullfiles = fullfiles.sort((a, b) => (a.name > b.name ? 1 : -1))
        } else {
            fullfiles = fullfiles.sort((a, b) => (a.name < b.name ? 1 : -1))
        }
    }

    $: sort_files(sortFile)

    const changeDirectory = async (goto) => {
        currentLocation = await path.resolve(currentLocation, goto)
    }

    $: if (currentLocation) {
        fileChecked = []
    }

    let refresh = false
    $: fileSelected = fileChecked
    $: panel_size = fullfiles.length ? (otherfolders.length ? 90 : 100) : 10
</script>

<div class="top__div px-1 mb-3 box {className}">
    <div class="mr-auto">
        <button class="i-mdi-arrow-back" on:click={() => changeDirectory('..')} />
        <RefreshButtons
            on:refresh={() => {
                keepfiles = true
                refresh = !refresh
            }}
        />
        <button
            class={sortFile ? 'i-mdi-trending-up' : 'i-mdi-trending-down'}
            on:click={() => (sortFile = !sortFile)}
        />
    </div>

    <div class="ml-auto">
        <button
            class={selectAll ? 'i-mdi-cancel-outline' : 'i-mdi-select-all'}
            on:click={() => {
                selectAll = !selectAll
                selectAll ? (fileChecked = fullfiles.map((file) => file.name)) : (fileChecked = [])
            }}
        />

        <button class="i-mdi-search" on:click={() => searchSurface.setOpen(true)} />
    </div>

    <MenuSurface
        style="background: var(--background-color); width: 100%;"
        bind:this={searchSurface}
        anchorCorner="BOTTOM_START"
    >
        <div class="p-2">
            <Textfield
                style="width: 100%;"
                on:keyup={searchfile}
                bind:value={searchKey}
                label="Search {filetype} files"
            />
        </div>
    </MenuSurface>
</div>

<div class="main__container" id="{uniqueID}-{filetype}_filebrowser">
    <div class="file-dir">
        <div class="i-mdi-folder-open-outline text-xs" />
        <div class="folder_name__div">
            {#await path.basename(currentLocation) then name}
                <div>{name}</div>
            {:catch _}
                <div>undefined</div>
            {/await}
            {#if searchKey}
                <div class="tag is-small is-warning">{searchKey}</div>
                <button
                    class="button tag is-danger"
                    on:click={() => {
                        searchKey = ''
                        searchfile()
                        refresh != refresh
                    }}>X</button
                >
            {/if}
        </div>
    </div>

    {#key refresh}
        {#if currentLocation}
            {#await getfiles(currentLocation)}
                <div class="mdc-typography--subtitle1 align center">...loading</div>
            {:then _}
                <VSplitPane
                    minTopPaneSize="10%"
                    topPanelSize={panel_size + '%'}
                    minDownPaneSize={otherfolders.length ? '5%' : '0%'}
                    downPanelSize={100 - panel_size + '%'}
                >
                    <top slot="top">
                        {#if fullfiles.length}
                            <VirtualCheckList
                                on:fileselect
                                bind:fileChecked
                                {fileSelected}
                                items={fullfiles}
                                markfiletype="felix"
                            />
                        {:else if fullfiles.length <= 0}
                            <div>No {filetype} here! or try reload files</div>
                        {/if}
                    </top>

                    <down slot="down">
                        {#if otherfolders.length}
                            <div style="overflow-y: auto; height: 100%;">
                                {#each otherfolders as folder (folder.id)}
                                    <div class="align" transition:slide|local>
                                        <div class="i-mdi-folder-outline text-xs" />
                                        <span
                                            role="presentation"
                                            style="cursor: pointer;"
                                            on:click={() => changeDirectory(folder.name)}>{folder.name}</span
                                        >
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </down>
                </VSplitPane>
            {:catch error}
                <div>{error}</div>
            {/await}
        {/if}
    {/key}
</div>

<style lang="scss">
    div.top__div {
        display: flex;
        gap: 0.2em;
        height: 3em;
        align-items: center;
    }
    .main__container {
        width: 100%;
        display: grid;
        grid-auto-flow: row;
        overflow-y: hidden;
        gap: 0.1em;
        grid-template-rows: auto 1fr;
    }
    .file-dir {
        gap: 0.5em;
        display: grid;
        align-items: center;
        grid-template-columns: auto 1fr;
    }
    .folder_name__div {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.1em;
    }
</style>
