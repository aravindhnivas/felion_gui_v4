<script lang="ts">
    import { activePage } from '$src/sveltewritables'
    import Tab, { Label } from '@smui/tab'
    import TabBar from '@smui/tab-bar'
    import { onMount } from 'svelte'
    import { Badge } from '$src/components'

    export let navItems: string[] = []

    const navigate = () => {
        navItems.forEach((item) => {
            const currentPage = document.getElementById(item)

            if (!currentPage) return
            item === $activePage ? (currentPage.style.display = 'grid') : (currentPage.style.display = 'none')
        })
    }

    $: if ($activePage) {
        navigate()
    }
    onMount(() => {
        document.getElementById('navbar').style.display = 'block'
        navigate()
    })
</script>

<div
    role="presentation"
    class="box animate__animated animate__fadeInDown"
    id="navbar"
    style="display:none; background: #5a419b;"
    on:click={navigate}
>
    <TabBar tabs={navItems} let:tab bind:active={$activePage}>
        <Tab {tab}>
            <Label>
                <span class="mr-3">{tab}</span>
                <Badge class="navbar-badge" aria-label="{tab}-navbar-status-badge" id="navbar-badge-{tab}" />
            </Label>
        </Tab>
    </TabBar>
</div>

<style lang="scss" global>
    #navbar {
        width: 100vw;
        margin-bottom: 0;
        padding: 0;
        .navbar-badge {
            top: 15px;
        }
    }
</style>
