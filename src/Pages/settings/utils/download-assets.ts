import { felionlibVersion } from '$lib/pyserver/stores'
import { outputbox, downloadURL, downloadoverrideURL} from './stores'
import { platform } from '@tauri-apps/api/os'
import { http } from '@tauri-apps/api'

let assets_downloading = false
let assets_download_needed = false
let assets_version_available = ''

export async function downloadZIP(url, filename) {
    try {
        outputbox.add({ value: 'downloading assets...', type: 'warning' })
        const URL_to_download = get(downloadoverrideURL) ? get(downloadURL) : url
        outputbox.add({ value: URL_to_download, type: 'warning' })
        const response = await http.fetch(URL_to_download, {
            method: 'GET',
            responseType: http.ResponseType.Binary,
        })
        // console.log(response)
        if (!response.ok) {
            outputbox.add({ value: `Status ${response.status} : Invalid URL`, type: 'danger' })
            return
        }
        outputbox.add({ value: `assets downloaded`, type: 'success' })
        await fs.writeBinaryFile(filename, response.data as Uint8Array, { dir: fs.BaseDirectory.AppLocalData })
        outputbox.add({ value: `assets saved`, type: 'success' })
        await unZIP(filename)
    } catch (error) {
        outputbox.add({ value: `error occure while downloading assets`, type: 'danger' })
        window.handleError(error)
    }
}
export async function unZIP(filename) {
    const filepath = await path.appLocalDataDir()
    const cmd = new shell.Command(`unzip-${await platform()}`, [
        'Expand-Archive',
        '-Path',
        `${await path.join(filepath, filename)}`,
        '-DestinationPath',
        `${filepath}`,
        '-Force',
    ])

    let err: string
    const child = await cmd.spawn()

    outputbox.add({ value: `unzip PID: ${child.pid}`, type: 'info' })
    cmd.on('close', () => {
        outputbox.add({ value: 'UNZIP closed', type: 'info' })
        outputbox.add({ value: err ? 'failed to UNZIP' : 'UNZIP success', type: err ? 'danger' : 'success' })
    })

    cmd.on('error', (error) => {
        err = error
        outputbox.add({ value: 'Error whiile UNZIPing assets', type: 'danger' })
        outputbox.add({ value: JSON.stringify(error), type: 'danger' })
    })

    cmd.stderr.on('data', (stderr) => {
        err = stderr
        outputbox.add({ value: JSON.stringify(stderr), type: 'danger' })
    })

    cmd.stdout.on('data', (stdout) => {
        outputbox.add({ value: JSON.stringify(stdout), type: 'info' })
    })
}

export const check_assets_update = async (override = false) => {
    const URL = import.meta.env.VITE_URL_FELIONPY_VERSION
    console.warn(URL, typeof URL)
    if (!get(felionlibVersion)) {
        outputbox.add({ value: 'Current version not determined yet.', type: 'danger' })
        if(!override) return
    }

    outputbox.add({ value: 'checking for assets update...', type: 'info' })
    const [_err1, response] = await oO(
        http.fetch<{ version: string }>(
            URL,
            {
                method: 'GET',
                responseType: http.ResponseType.JSON,
            }
        )
    )
    if (_err1) return window.handleError(_err1)
    if (!response.ok) return window.createToast('Could not download the assets', 'danger')

    const { version } = response.data
    outputbox.add({ value: `Available version: ${version}`, type: 'info' })
    outputbox.add({ value: `Current version: ${get(felionlibVersion)}`, type: 'info' })
    assets_version_available = `v${version}`
    assets_download_needed = get(felionlibVersion) < version
    if (assets_download_needed) {
        outputbox.add({ value: `Download required`, type: 'warning' })
    } else {
        outputbox.add({ value: `Download not required`, type: 'warning' })
    }
}

export const download_assets = async () => {

    if (!assets_version_available) {
        outputbox.add({ value: 'Check for assets update first.', type: 'warning' })
        return
    }

    assets_downloading = true

    const asset_name = `felionpy-${await platform()}.zip`
    const base_url = import.meta.env.VITE_URL_FELIONPY_BASE
    const URL = `${base_url}/${assets_version_available}/${asset_name}`

    if (assets_download_needed) {
        await downloadZIP(URL, asset_name)
        return
    }
    if (!(await dialog.confirm('Download anyway', { title: 'Download not required' }))) return
    await downloadZIP(URL, asset_name)
}