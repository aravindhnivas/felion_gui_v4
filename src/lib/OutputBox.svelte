<script lang="ts">
    export let id = window.getID()
    export let items: string[]
    const dispatch = createEventDispatcher()
</script>

<div {id} class="align box output__div">
    <ul>
        <li style="display: flex; justify-content: flex-end;">
            <button class="button is-danger mb-2" on:click={() => dispatch('clear')}>Clear</button>
        </li>
        {#each items as item}
            <li>>> {item}</li>
        {/each}
    </ul>
</div>

<style lang="scss">
    .output__div {
        user-select: text;
        overflow-x: auto;
        background-color: whitesmoke;
        height: 300px;
        align-items: baseline;
        * {
            color: black;
        }
        ul,
        ul > li {
            width: 100%;
        }
        ul li {
            white-space: pre-line;
        }
        &::-webkit-scrollbar-thumb {
            background-color: grey;
        }
    }
</style>
