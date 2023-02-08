import { downloadoverrideURL, python_asset_ready, outputbox, python_asset_ready_to_install } from './stores'
import { asset_name_prefix, download_assets, unZIP, check_assets_update } from './download-assets'

export const check_felionpy_assets_status = async () => {
    try {
        python_asset_ready.set(false)
        if (await fs.exists(asset_name_prefix, { dir: fs.BaseDirectory.AppLocalData })) {
            python_asset_ready.set(true)
            await check_assets_update()
            return
        }
        if (!(await dialog.confirm('Python assets are missing. Press OK to download.'))) return

        await auto_download_and_install_assets()
    } catch (error) {
        outputbox.error(error)
    }
}

export const auto_download_and_install_assets = async ({ installation_request = false } = {}) => {
    downloadoverrideURL.set(false)
    outputbox.warn('Starting auto download python assets')

    if (!(await fs.exists(`${asset_name_prefix}-${await platform()}.zip`, { dir: fs.BaseDirectory.AppLocalData }))) {
        await download_assets()
    } else {
        outputbox.warn('assets already downloaded')
        python_asset_ready_to_install.set(true)
    }

    await unZIP(installation_request)
    python_asset_ready.set(true)
}
