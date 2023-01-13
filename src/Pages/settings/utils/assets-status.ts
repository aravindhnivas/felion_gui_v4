import { downloadoverrideURL, python_asset_ready, outputbox } from './stores'
import { check_assets_update, download_assets, unZIP } from './download-assets'

export const check_felionpy_assets_status = async () => {
    try {
        python_asset_ready.set(false)
        if (await fs.exists('felionpy', { dir: fs.BaseDirectory.AppLocalData })) {
            python_asset_ready.set(true)
            return
        }

        console.warn('felionpy asset REQUIRED!!')
        if (!(await dialog.confirm('Python assets are missing. Press OK to download.'))) return

        await auto_download_and_install_assets()
    } catch (error) {
        outputbox.error(error)
    }
}

export const auto_download_and_install_assets = async ({ installation_request = false } = {}) => {
    downloadoverrideURL.set(false)
    await check_assets_update()
    await download_assets()
    await unZIP(installation_request)
    python_asset_ready.set(true)
}
