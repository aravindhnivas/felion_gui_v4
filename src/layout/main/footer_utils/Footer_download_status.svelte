<script lang="ts">
    import { footerMsg } from './stores'
</script>

<div class="mr-2">
    {#if $footerMsg.status === 'running'}
        <div class="icon-footer">
            <span>{$footerMsg.msg}</span>
            <lord-icon trigger="loop" src="/assets/icons/lottie/loader.json" />
        </div>
    {/if}

    {#if $footerMsg.status === 'done'}
        <div class="icon-footer">
            <span>Download completed</span>
            <lord-icon trigger="hover" src="/assets/icons/lottie/confetti.json" />
        </div>
    {/if}
</div>

<style>
    .icon-footer {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }
</style>
