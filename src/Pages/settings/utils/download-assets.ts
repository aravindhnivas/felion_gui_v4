import { felionlibVersion } from '$lib/pyserver/stores'
import {
    outputbox,
    downloadURL,
    downloadoverrideURL,
    override_felionpy_version_check,
    unzip_downloaded_assets,
    python_asset_ready_to_install,
} from './stores'
import { platform } from '@tauri-apps/api/os'
import { invoke } from '@tauri-apps/api'
import axios from 'axios'
import { isEmpty, round } from 'lodash-es'

import { stopServer } from '$src/lib/pyserver/felionpyServer'
let assets_downloading = false
let assets_download_needed = false
let assets_version_available = ''

export async function downloadZIP(filename) {
    try {
        if (assets_downloading) return outputbox.warn('already downloading assets...')
        let browser_download_url = ''

        assets_downloading = true
        if (!get(downloadoverrideURL)) {
            if (isEmpty(current_release_data)) {
                outputbox.error('To download assets, first check assets update to obtain release data...')
                return
            }

            const { assets } = current_release_data as { assets: [{ name: string; browser_download_url: string }] }
            const asset_ind = assets.findIndex((e) => e.name === filename)

            // const { browser_download_url } = assets[asset_ind]
            browser_download_url = assets[asset_ind].browser_download_url
            // console.log({ browser_download_url })

            outputbox.warn('downloading assets...')
        }
        const URL_to_download = get(downloadoverrideURL) ? get(downloadURL) : browser_download_url

        outputbox.warn(URL_to_download)
        const startTime = performance.now()

        const localdir = await path.appLocalDataDir()
        const fileName = await path.join(localdir, filename)
        const [download_err, download_output] = await oO(invoke('download_url', { url: URL_to_download, fileName }))

        if (download_err) {
            outputbox.error(download_err as string)
            return
        }

        outputbox.success(download_output as string)

        const duration = performance.now() - startTime
        outputbox.warn(`Time taken to download: ${round(duration, 0)} ms`)
        outputbox.success(`assets downloaded`)

        python_asset_ready_to_install.set(true)
        if (get(unzip_downloaded_assets)) {
            await unZIP(filename)
        }
    } catch (err) {
        outputbox.error(`error occured while downloading assets`)
        outputbox.error(err)
    } finally {
        assets_downloading = false
    }
}

export function unZIP(filename) {
    return new Promise(async (resolve, reject) => {
        if (!(await dialog.confirm('Install it now ?', { title: 'Python assets downloaded ready.' }))) {
            return resolve('')
        }

        await stopServer()

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

        outputbox.info(`unzip PID: ${child.pid}`)

        cmd.on('close', async () => {
            if (err) {
                outputbox.error('failed to UNZIP')
                reject('failed to UNZIP')
            } else {
                outputbox.success('UNZIP success')
                resolve('UNZIP success')
            }
            outputbox.info('UNZIP closed')
            await window.sleep(1000)
            await fs.renameFile(filename, `${filename}.DELETE`, { dir: fs.BaseDirectory.AppLocalData })
            python_asset_ready_to_install.set(false)
        })

        cmd.on('error', (error) => {
            err = error
            outputbox.error('Error whiile UNZIPing assets')
            outputbox.error(error)
        })

        cmd.stderr.on('data', (stderr) => {
            err = stderr
            outputbox.error(stderr)
        })

        cmd.stdout.on('data', (stdout) => {
            outputbox.info(stdout)
        })
    })
}

let current_release_data = {}

export const check_assets_update = async () => {
    if (!get(felionlibVersion)) {
        outputbox.error('Current version not determined yet.')
        if (!get(override_felionpy_version_check)) return
    }

    const URL = 'https://api.github.com/repos/aravindhnivas/felionpy/releases/latest'
    outputbox.info('checking for assets update...')

    const [_err1, response] = await oO(axios<{ tag_name: string }>(URL))
    if (_err1) return window.handleError(_err1)

    if (response.status !== 200) return window.createToast('Could not download the assets', 'danger')

    current_release_data = response.data
    console.log(current_release_data)
    const { tag_name } = response.data
    outputbox.info(`Available version: ${tag_name}`)
    outputbox.info(`Current version: v${get(felionlibVersion)}`)
    assets_version_available = tag_name
    assets_download_needed = `v${get(felionlibVersion)}` < tag_name
    if (assets_download_needed) {
        outputbox.warn(`Download required`)
    } else {
        outputbox.warn(`Download not required`)
    }
}

export const download_assets = async () => {
    const asset_name = `felionpy-${await platform()}.zip`
    if (!get(downloadoverrideURL) && get(python_asset_ready_to_install)) {
        await unZIP(asset_name)
        return
    }

    if (!get(downloadoverrideURL) && !assets_version_available) {
        outputbox.warn('Check for assets update first.')
        return
    }

    if (assets_download_needed) {
        await downloadZIP(asset_name)
        return
    }
    if (!get(downloadoverrideURL) && !(await dialog.confirm('Download not required', { title: 'Download anyway' })))
        return
    await downloadZIP(asset_name)
}
