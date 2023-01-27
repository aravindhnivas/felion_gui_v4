<script>
    import Simplewave from '$lib/Simplewave.svelte'
</script>

<section class="section animate__animated animate__fadeIn" id="Home" style="display:none">
    <Simplewave>
        <svelte:fragment slot="header">
            <h1 class="title">FELion Spectrum Analyser</h1>
            <h1 class="subtitle">To analyse FELIX data for FELion Instrument</h1>
        </svelte:fragment>

        <svelte:fragment slot="footer">
            <p>
                Developed at {import.meta.env.VITE_GROUP} FELion@FELIX | {import.meta.env.VITE_YEAR} &copy; {import.meta
                    .env.VITE_AUTHOUR}
            </p>
        </svelte:fragment>
    </Simplewave>
</section>

<style>
    #Home {
        padding: 0;
        margin: 0;
        height: 100%;
    }

    h1 {
        letter-spacing: 2px;
    }

    .title {
        font-size: 4em;
    }

    p {
        color: black;
    }

    @media (max-width: 768px) {
        .title {
            font-size: 3em;
        }
    }
</style>
