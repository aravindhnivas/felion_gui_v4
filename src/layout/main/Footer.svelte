<script lang="ts">
    import FooterLabel from './footer_utils/Footer_label.svelte'
    import FooterDownloadStatus from './footer_utils/Footer_download_status.svelte'
    import FooterProcess from './footer_utils/Footer_processes.svelte'
</script>

<div class="animate__animated animate__fadeInUp" id="footer">
    <div class="navbar-menu">
        <div class="navbar-start">
            <div class="navbar-item">
                <p>Developed at Dr.Br&uuml;nken's group FELion@FELIX</p>
            </div>
        </div>

        <div class="navbar-end">
            <FooterLabel />
            <FooterDownloadStatus />
            <FooterProcess />
            <div class="navbar-item">
                <p>{import.meta.env.VITE_YEAR} &copy; {import.meta.env.VITE_AUTHOUR}</p>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .process__notify_container {
        cursor: pointer;
    }
    .navbar-end {
        display: flex;
        .navbar-item:not(:only-child) {
            border-left: solid 1px;
        }

        div {
            align-self: center;
            margin-right: 0.5em;
        }
    }
</style>
