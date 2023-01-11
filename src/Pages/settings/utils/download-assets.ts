import { felionlibVersion } from '$lib/pyserver/stores'
import { outputbox, downloadURL, downloadoverrideURL } from './stores'
import { platform } from '@tauri-apps/api/os'
import { http } from '@tauri-apps/api'
import axios, { type ResponseType } from 'axios'
import { isEmpty, round } from 'lodash-es'
import { startServer, stopServer } from '$src/lib/pyserver/felionpyServer'
let assets_downloading = false
let assets_download_needed = false
let assets_version_available = ''

const tauriDownload = async (url: string, responseType: http.ResponseType = http.ResponseType.Binary) => {
    try {
        console.time('tauri fetch download')
        const res = await http.fetch<Uint8Array>(url, {
            method: 'GET',
            responseType,
        })
        // console.log(res)
        console.timeEnd('tauri fetch download')
        return res
    } catch (e) {
        outputbox.add({ value: JSON.stringify(e, null, 2), type: 'danger' })
    }
}

const axiosDownload = async (url: string, responseType: ResponseType = 'arraybuffer') => {
    try {
        console.time('axios download')
        const res = await axios<Uint8Array>(url, {
            method: 'get',
            responseType,
        })
        console.log(res)

        return res
    } catch (e) {
        outputbox.add({ value: JSON.stringify(e, null, 2), type: 'danger' })
    } finally {
        console.timeEnd('axios download')
    }
}
export async function downloadZIP(filename) {
    try {
        if (assets_downloading) return outputbox.add({ value: 'already downloading assets...', type: 'warning' })
        assets_downloading = true
        if (isEmpty(current_release_data)) {
            outputbox.add({
                value: 'To download assets, first check assets update to obtain release data...',
                type: 'danger',
            })
            return
        }

        const { assets } = current_release_data
        const asset_ind = assets.findIndex((e) => e.name === filename)

        const { browser_download_url } = assets[asset_ind]
        console.log({ browser_download_url })

        outputbox.add({ value: 'downloading assets...', type: 'warning' })
        const URL_to_download = get(downloadoverrideURL) ? get(downloadURL) : browser_download_url

        outputbox.add({ value: URL_to_download, type: 'warning' })
        const startTime = performance.now()

        const response = await tauriDownload(URL_to_download)
        // const response2 = await axiosDownload(URL_to_download)

        const duration = performance.now() - startTime
        outputbox.add({ value: `Time taken to download: ${round(duration, 0)} ms`, type: 'warning' })

        // return
        if (response.status !== 200) {
            outputbox.add({ value: `Status ${response.status} : Invalid URL`, type: 'danger' })
            return
        }

        outputbox.add({ value: `assets downloaded`, type: 'success' })

        // return
        outputbox.add({ value: `saving downloaded assets...`, type: 'success' })
        await fs.writeBinaryFile(filename, response.data, { dir: fs.BaseDirectory.AppLocalData })
        outputbox.add({ value: `assets saved`, type: 'success' })

        await unZIP(filename)
        await fs.renameFile(filename, `${filename}.DELETE`, { dir: fs.BaseDirectory.AppLocalData })
    } catch (err) {
        outputbox.add({ value: `error occured while downloading assets`, type: 'danger' })
        outputbox.add({ value: JSON.stringify(err, null, 2), type: 'danger' })
    } finally {
        assets_downloading = false
    }
}

export function unZIP(filename) {
    return new Promise(async (resolve, reject) => {
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
            err ? reject('failed to UNZIP') : resolve('UNZIP success')
        })

        cmd.on('error', (error) => {
            err = error
            outputbox.add({ value: 'Error whiile UNZIPing assets', type: 'danger' })
            outputbox.add({ value: JSON.stringify(error, null, 2), type: 'danger' })
        })

        cmd.stderr.on('data', (stderr) => {
            err = stderr
            outputbox.add({ value: JSON.stringify(stderr, null, 2), type: 'danger' })
        })

        cmd.stdout.on('data', (stdout) => {
            outputbox.add({ value: JSON.stringify(stdout, null, 2), type: 'info' })
        })
    })
}

let current_release_data = {}

export const check_assets_update = async (override = false) => {
    // const URL = import.meta.env.VITE_URL_FELIONPY_VERSION
    // console.warn(URL, typeof URL)
    if (!get(felionlibVersion)) {
        outputbox.add({ value: 'Current version not determined yet.', type: 'danger' })
        if (!override) return
    }

    const URL = 'https://api.github.com/repos/aravindhnivas/felionpy/releases/latest'
    outputbox.add({ value: 'checking for assets update...', type: 'info' })

    console.time('axios fetch')
    const [_err1, response] = await oO(axios<{ tag_name: string }>(URL))
    console.timeEnd('axios fetch')

    if (_err1) return window.handleError(_err1)
    if (response.status !== 200) return window.createToast('Could not download the assets', 'danger')

    current_release_data = response.data
    console.log(current_release_data)
    const { tag_name } = response.data
    outputbox.add({ value: `Available version: ${tag_name}`, type: 'info' })
    outputbox.add({ value: `Current version: v${get(felionlibVersion)}`, type: 'info' })
    assets_version_available = tag_name
    assets_download_needed = `v${get(felionlibVersion)}` < tag_name
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
    const asset_name = `felionpy-${await platform()}.zip`
    if (assets_download_needed) {
        await downloadZIP(asset_name)
        return
    }
    if (!get(downloadoverrideURL) && !(await dialog.confirm('Download anyway', { title: 'Download not required' })))
        return
    await downloadZIP(asset_name)
}
