<script>
    import Kinetics from './timescan/components/Kinetics.svelte'
    import ROSAA from './thz/ROSAA.svelte'

    const kineticMode = persistentWritable('kineticMode', true)
</script>

<section id="Kinetics" style="display:block" class="animate__animated animate__fadeIn">
    <div class="main_div">
        <div class="nav box">
            <div
                role="presentation"
                class="hvr-glow"
                class:active={$kineticMode}
                on:click={() => ($kineticMode = true)}
            >
                Kinetics
            </div>

            <div
                role="presentation"
                class="hvr-glow"
                class:active={!$kineticMode}
                on:click={() => ($kineticMode = false)}
            >
                ROSAA Model
            </div>
        </div>

        <div class="content box">
            <div class="subcontent" class:hide={!$kineticMode}>
                <Kinetics />
            </div>
            <div class="subcontent" class:hide={$kineticMode}><ROSAA /></div>
        </div>
    </div>
</section>

<style lang="scss">
    #Kinetics {
        padding: 0.5em;
    }

    .main_div {
        display: grid;
        gap: 0.5em;
        grid-template-columns: 1fr 10fr;
        .nav {
            display: flex;
            gap: 0.5em;
            flex-direction: column;
            padding: 0.5em;

            div {
                padding: 0.5em;
                border-radius: 0.5em;

                cursor: pointer;
            }
            .active {
                box-shadow: 0 0 8px rgb(0 0 0 / 60%);
            }
        }

        .content .subcontent {
            display: grid;
            overflow: hidden;
            max-height: calc(100vh - 10rem);
            height: calc(100vh - 10rem);
        }
    }
</style>
