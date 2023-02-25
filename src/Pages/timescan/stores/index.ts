export const config_filename = persistentWritable('kinetics_config_filename', 'kinetics.configs.json')
export const channels_file = persistentWritable('channels_file', 'kinetics.channels.json')
export const kinetics_params_file = persistentWritable('kinetics_params_file', 'kinetics.params.json')
export const fit_config_filename = persistentWritable('kinetics_fitted_values', 'kinetics.fit.json')
export const kinetics_filenames = derived(
    [config_filename, channels_file, kinetics_params_file, fit_config_filename],
    ([$config_filename, $channels_file, $kinetics_params_file, $fit_config_filename]) => {
        return {
            configs: $config_filename,
            channels: $channels_file,
            params: $kinetics_params_file,
            fit: $fit_config_filename,
        }
    }
)
