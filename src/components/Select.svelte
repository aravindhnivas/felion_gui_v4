<script lang="ts">
    export let options: string[] = []
    export let label = ''
    export let value: string[] | string = ''
    export let multiple = false
    export let update: ((toast?: boolean) => void) | null = null
    export let auto_init = false
    export let lookIn: string = ''
    export let lookFor: string = '*'

    onMount(() => {
        if (lookIn) {
            update = async (toast = true) => {
                console.log(lookIn, lookFor)
                if (!(await fs.exists(lookIn))) {
                    if (toast) {
                        console.error(`looking in ${lookIn} is not a directory`)
                        window.createToast('Invalid path', 'danger')
                    }
                    return
                }
                const folders = await fs.readDir(lookIn)
                options = folders?.filter((n) => n.name.endsWith(lookFor)).map((n) => n.name)
                if (toast) window.createToast(`Found ${options.length} files`, 'success')
                // console.log(options)
                if (auto_init && value && options.length === 0) {
                    if (typeof value === 'string') options[0] = value
                }
            }
            update(false)
            // if (!value && options.length > 0) value = options[0]
            console.log('update', options, value)
            value ||= options[0] || ''
        }
    })

    $: if (update && lookIn) update(false)
</script>

<div class="container">
    <span style="font-size: small;">{label}</span>
    <div class:contanier-with-icon={update}>
        <div class="select" class:is-multiple={multiple}>
            {#if multiple}
                <select multiple bind:value {label} size={options.length} on:change on:click on:dblclick>
                    {#each options as option}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            {:else}
                <select bind:value {label} on:change on:click on:dblclick>
                    {#each options as option}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            {/if}
        </div>

        {#if update}
            <i
                role="presentation"
                class="material-symbols-outlined animate__animated animate__faster"
                on:animationend={({ currentTarget }) => currentTarget.classList.remove('animate__rotateIn')}
                on:click={({ currentTarget }) => {
                    currentTarget.classList.add('animate__rotateIn')
                    update?.()
                }}
            >
                refresh
            </i>
        {/if}
    </div>
</div>

<style lang="scss">
    .container {
        display: flex;
        flex-direction: column;
    }

    .contanier-with-icon {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    .select {
        align-self: auto;
        width: 100%;
        select {
            width: 100%;
            min-width: 5rem;
            &:active,
            &:hover,
            &:focus {
                border-bottom: solid 2px white;
            }
            border: none;
            border-bottom: solid 2px #c5c3c3;
        }

        select::-webkit-scrollbar {
            width: 0.5rem;
            height: 8px;
            background-color: white;
        }

        select::-webkit-scrollbar-thumb {
            background-color: #5669d3;
        }

        select[multiple] {
            // height: 4em;
            overflow-x: auto;
            overflow-y: auto;
            option {
                color: white;
                &:checked,
                &:focus {
                    background: #5669d3;
                }
            }
        }
    }
</style>
