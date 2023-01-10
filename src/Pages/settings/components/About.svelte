<script lang="ts">
    import { currentTab, pyVersion, felionlibVersion } from '$lib/pyserver/stores'
    import { getVersion, getTauriVersion } from '@tauri-apps/api/app'
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
        </ul>
    </div>
</div>
