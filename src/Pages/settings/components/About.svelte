<script lang="ts">
    import { currentTab, pyVersion, felionlibVersion } from '$lib/pyserver/stores'
    import { getVersion, getTauriVersion } from '@tauri-apps/api/app'
    let py_modules = []
    onMount(async () => {
        const result = await axios(import.meta.env.VITE_FELIONPY_RAW_URL + 'src/requirements.txt')
        py_modules = result?.data.split('\n') ?? ''
    })
</script>

<div class="animate__animated animate__fadeIn" class:hide={$currentTab !== 'About'}>
    <h1>About</h1>
    <div class="content">
        <ul style="user-select: text;" class="ml-0">
            {#await getVersion() then value}
                <li>FELionGUI: {value}</li>
            {/await}

            {#await getTauriVersion() then value}
                <li>Tauri: {value}</li>
            {/await}
            <li>Python {$pyVersion}</li>
            <li>felionlib {$felionlibVersion}</li>
            <hr />

            {#if $felionlibVersion && py_modules.length > 0}
                <h3>Python libraries</h3>
                {#each py_modules as module}
                    <li>{module}</li>
                {/each}
            {/if}
        </ul>
    </div>
</div>
