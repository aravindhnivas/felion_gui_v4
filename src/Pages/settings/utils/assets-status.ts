import {
    downloadoverrideURL,
    override_felionpy_version_check,
    unzip_downloaded_assets,
    python_asset_ready,
    outputbox,
} from './stores'
import { check_assets_update, download_assets } from './download-assets'
import { platform } from '@tauri-apps/api/os'
export const check_felionpy_assets_status = async () => {
    try {
        python_asset_ready.set(false)

        if (await fs.exists('felionpy', { dir: fs.BaseDirectory.AppLocalData })) {
            python_asset_ready.set(true)
            return
        }
        console.warn('felionpy asset REQUIRED!!')

        if (!(await dialog.confirm('Python assets are missing. Press OK to download.'))) return

        downloadoverrideURL.set(false)
        override_felionpy_version_check.set(true)
        unzip_downloaded_assets.set(true)
        await check_assets_update()
        await download_assets()

        override_felionpy_version_check.set(false)
        unzip_downloaded_assets.set(true)

        python_asset_ready.set(true)
    } catch (error) {
        outputbox.error(error)
    }
}

export const check_assets_to_delete = async () => {
    if (!(await fs.exists(`felionpy-${await platform()}.zip.DELETE`, { dir: fs.BaseDirectory.AppLocalData })))
        return Promise.resolve('')

    outputbox.info('removing temp files from localdir')

    const [_err] = await oO(
        fs.removeFile(`felionpy-${await platform()}.zip.DELETE`, {
            dir: fs.BaseDirectory.AppLocalData,
        })
    )

    if (_err) {
        console.warn('Could not remove temp files')
        console.error(_err)
    } else {
        console.warn('Temp files removed from localdir')
    }
}
