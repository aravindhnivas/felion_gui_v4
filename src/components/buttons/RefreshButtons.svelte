<script langs="ts">
    const dispatch = createEventDispatcher()
</script>

<button
    class="animate__animated animate__faster i-mdi-refresh"
    on:click={({ currentTarget }) => {
        currentTarget.classList.add('animate__rotateIn')
        dispatch('refresh')
    }}
    on:animationend={({ currentTarget }) => {
        currentTarget.classList.remove('animate__rotateIn')
    }}
/>
