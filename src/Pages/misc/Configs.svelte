<script lang="ts">
    import Textfield from '@smui/textfield';
   
    let CONFIGS = {}
    const update_list = () => {
        const len = localStorage.length
        for(let i = 0; i < len; i++){
            const key = localStorage.key(i)
            const config = localStorage.getItem(key)
            CONFIGS = {...CONFIGS, [key]: config}
        }
    }

    onMount(update_list)
    // $: console.log(CONFIGS)
</script>

<div class="config_main__div box">
    <!-- <div class="two_col__div">
        <Textfield style="border: solid 1px #fff7;" value={window.db.path} label="CONFIGS location" disabled />
        <i role="presentation" class="material-symbols-outlined" on:click={() => window.shell.showItemInFolder(window.db.path)}>open_in_new</i>
    </div> -->

    <div class="config__div ">
        {#key CONFIGS}
            {#each Object.keys(CONFIGS) as label(label)}
                <div class="config_content">
                    <Textfield value={CONFIGS[label]} {label} on:keyup={e => {
                        if (e.key === 'Enter') {
                            window.localStorage.setItem(label, CONFIGS[label])
                            window.createToast('Saved', 'success')
                        }
                    }} />
                    <span role="presentation" class="material-symbols-outlined" on:click={()=>{
                            window.localStorage.setItem(label, CONFIGS[label])
                            update_list()
                            window.createToast('Saved', 'success')
                        }}>
                        save_as
                    </span>
                    
                    <span role="presentation" 
                        class="material-symbols-outlined has-background-danger"
                        on:click={() => {
                            window.localStorage.removeItem(label)
                            update_list()
                            window.createToast(`${label} deleted`, 'danger')
                        }}
                        >close</span>
                </div>
                {:else}
                <h1>No data</h1>
            {/each}
        {/key}
    </div>

    <div class="config_footer" style="margin-left: auto;">
        <button class="button is-danger"
        on:click={() => {window.localStorage.clear(); update_list()}}>Clear all</button
        >
    </div>
</div>

<style lang="scss">
    // .two_col__div {
    //     display: grid;
    //     grid-auto-flow: column;
    //     grid-template-columns: 1fr auto;
    // }
    .config_main__div {
        display: grid;
        grid-template-rows: auto 1fr auto;
        max-height: calc(100vh - 15rem);
        gap: 1em;
        .config__div {
            display: grid;
            overflow: auto;

            padding-right: 1em;
            gap: 1em;
            .config_content {
                display: grid;
                grid-auto-flow: column;
                grid-template-columns: 1fr auto;
                align-items: center;
                gap: 1em;
            }
        }
    }
</style>