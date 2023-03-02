<script lang="ts">
    import { channels_file } from '$src/Pages/timescan/stores'
    import ChannelComponent from './ChannelComponent.svelte'
    import { differenceBy, find } from 'lodash-es'
    import { Textfield, Switch, FileReadAndLoad } from '$src/components'
    import default_channels, { get_slider_controller, base_slider_values_str } from './default_channels'
    import CustomPanel from '$src/components/Panel.svelte'

    export let loss_channels: Timescan.LossChannel[] = []
    export let nameOfReactants = ''
    export let rateConstantMode = false
    export let configDir: string = ''
    export let useTaggedFile: boolean = false
    export let useParamsFile: boolean = false
    export let tagFile: string = ''
    export let selectedFile: string = ''
    export let load_data
    export let ND_name = 'He'

    let channelCounter = 0
    let maxGuess = '0.5'
    $: ions_lists = nameOfReactants.split(',').map((name) => name.trim())
    $: if (selectedFile) {
        defaultMode = false
    }
    const addChannel = () => {
        loss_channels = [
            {
                type: 'forwards',
                name: channelCounter > 0 ? `k_loss_${channelCounter}` : 'k_loss',
                lossFrom: ions_lists[0],
                attachTo: 'none',
                id: window.getID(),
                numberDensity: '',
                sliderController: base_slider_values_str(maxGuess),
            },
            ...loss_channels,
        ]
        channelCounter += 1
    }
    const ktrap_loss_channel = {
        type: 'forwards',
        name: 'ktrap_loss',
        lossFrom: '<resp. ion>',
        attachTo: 'none',
        id: window.getID(),
        numberDensity: '',
        sliderController: base_slider_values_str(maxGuess),
    }
    const updateTrapLossChannel = () => {
        const channelFound = find(loss_channels, ktrap_loss_channel)
        console.log(find(loss_channels, ktrap_loss_channel))
        if (channelFound) return window.createToast('channel already added', 'warning')
        loss_channels = [ktrap_loss_channel, ...loss_channels]
    }

    let defaultMode = false

    $: nameOfReactantsArr = nameOfReactants.split(',').map((n) => n.trim())
    let defaultChannelsArr: Timescan.LossChannel[]

    const make_default_channels = (event?: CustomEvent) => {
        if (!defaultMode) {
            loss_channels = differenceBy(loss_channels, defaultChannelsArr, 'id')
            return
        }
        defaultChannelsArr = default_channels(nameOfReactantsArr, rateConstantMode, maxGuess)
        loss_channels = [...loss_channels, ...defaultChannelsArr]
    }
    onMount(() => {
        loss_channels = []
        make_default_channels()
    })

    const trigger_rateConstantMode_change = () => {
        console.log('trigger_rateConstantMode_change')
        loss_channels = loss_channels.map((channel) => {
            const number_density_exponent = parseInt(channel?.numberDensity)
            if (!isNaN(number_density_exponent)) {
                if (rateConstantMode) {
                    channel.sliderController = get_slider_controller(number_density_exponent)
                } else {
                    channel.sliderController = base_slider_values_str(maxGuess)
                }
            }
            return channel
        })
    }

    const updateGuessMaxValues = () => {
        loss_channels = loss_channels.map((channel) => {
            channel.sliderController = base_slider_values_str(maxGuess)
            return channel
        })
    }
</script>

<CustomPanel loaded={loss_channels.length > 0} label="Channels" style="display: flex; flex-direction: column;">
    <FileReadAndLoad
        style="justify-content: flex-end;"
        bind:filename={$channels_file}
        bind:dataToSave={loss_channels}
        bind:load_data
        options_filter=".channels.json"
        {...{
            configDir,
            selectedFile,
            tagFile,
            useTaggedFile,
            useParamsFile,
        }}
    />
    <div class="align h-center">
        <button class="button is-link" on:click={addChannel}>Add channel</button>
        <button class="button is-warning" on:click={updateTrapLossChannel}>Add trap loss channel</button>
        <Switch bind:selected={defaultMode} label="He-attachment mode" on:change={make_default_channels} />
        <Switch
            bind:selected={rateConstantMode}
            label="rateConstant mode"
            on:change={trigger_rateConstantMode_change}
        />
        {#if rateConstantMode}
            <Textfield bind:value={ND_name} label="ND_name" />
        {/if}
    </div>

    <div class="align h-center mb-5">
        {#if !rateConstantMode}
            <Textfield bind:value={maxGuess} label="max-guess-value" />
            <button class="i-mdi-refresh" on:click={() => updateGuessMaxValues()} />
        {/if}
    </div>

    <div class="channels_div mb-5">
        {#each loss_channels as item, ind (item.id)}
            <ChannelComponent
                {item}
                {rateConstantMode}
                {ions_lists}
                {ind}
                on:remove={(e) => {
                    const { id } = e.detail
                    loss_channels = loss_channels.filter((c) => c.id !== id)
                    channelCounter--
                }}
            />
        {/each}
    </div>
</CustomPanel>

<style langs="scss">
    .channels_div {
        display: flex;
        flex-direction: column;
        row-gap: 1rem;
        overflow: auto;

        padding: 0 1em;
        width: 100%;
    }
</style>
