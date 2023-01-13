import { downloadoverrideURL, python_asset_ready, outputbox, asset_download_required } from './stores'
import { check_assets_update, download_assets, unZIP } from './download-assets'
import { felionlibVersion } from '$src/lib/pyserver/stores'

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

export const check_whether_asset_update_required = () => {
    if (get(felionlibVersion) >= import.meta.env.VITE_FELIONPY_MIN_VERSION) return
    asset_download_required.set(true)
}

export const auto_download_and_install_assets = async () => {
    downloadoverrideURL.set(false)
    await check_assets_update()
    await download_assets()
    await unZIP(false)
    python_asset_ready.set(true)
}
