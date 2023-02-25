import { downloadoverrideURL, python_asset_ready, outputbox, python_asset_ready_to_install, serverInfo } from './stores'
import { asset_name_prefix, check_assets_update, download_assets, unZIP } from './download-assets'
import { pyServerReady } from '$src/lib/pyserver/stores'

export const check_felionpy_assets_status = async ({ installation_request = false } = {}) => {
    try {
        python_asset_ready.set(false)

        if (await fs.exists(asset_name_prefix, { dir: fs.BaseDirectory.AppLocalData })) {
            python_asset_ready.set(true)
            python_asset_ready_to_install.set(false)
            serverInfo.warn('felionpy is installed')

            // if (get(pyServerReady)) await check_assets_update()
            return
        }

        if (!(await dialog.confirm('Python assets are missing. Press OK to download.'))) return
        await auto_download_and_install_assets({ installation_request })
    } catch (error) {
        outputbox.error(error)
    }
}

export const auto_download_and_install_assets = async ({
    installation_request = false,
    download_request = false,
} = {}) => {
    downloadoverrideURL.set(false)
    outputbox.warn('Starting auto download python assets')

    if (!(await fs.exists(`${asset_name_prefix}-${await platform()}.zip`, { dir: fs.BaseDirectory.AppLocalData }))) {
        if (download_request) {
            if (!(await dialog.confirm('Download python assets now ?', { title: 'update available' }))) return
        }
        await download_assets()
    } else {
        outputbox.warn('assets already downloaded')
        python_asset_ready_to_install.set(true)
    }

    const [_err] = await oO(unZIP(installation_request))
    if (_err) return
    python_asset_ready.set(true)
}
