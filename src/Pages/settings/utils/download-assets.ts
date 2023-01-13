import { felionlibVersion } from '$lib/pyserver/stores'
import { outputbox, downloadURL, downloadoverrideURL, python_asset_ready_to_install } from './stores'
import { platform } from '@tauri-apps/api/os'
import { invoke } from '@tauri-apps/api'
import { isEmpty, round } from 'lodash-es'
import { startServer, stopServer } from '$src/lib/pyserver/felionpyServer'
import { footerMsg } from '$src/layout/main/footer_utils/stores'

import axios from 'axios'

let assets_downloading = false
let assets_version_available = ''

export async function downloadZIP(filename) {
    try {
        if (!window.navigator.onLine) {
            outputbox.warn('No internet connection')
            return
        }
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

            browser_download_url = assets[asset_ind].browser_download_url
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
        await unZIP(filename)
    } catch (err) {
        outputbox.error(`error occured while downloading assets`)
        outputbox.error(err)
    } finally {
        assets_downloading = false
    }
}

export function unZIP(filename) {
    return new Promise(async (resolve, reject) => {
        footerMsg.set({ msg: 'installing assets...', status: 'running' })

        if (!(await dialog.confirm('Install it now ?', { title: 'Python assets downloaded ready.' }))) {
            return resolve('')
        }
        await stopServer()
        if (
            await fs.exists('felionpy', {
                dir: fs.BaseDirectory.AppLocalData,
            })
        ) {
            outputbox.warn('Trying to remove existing felionpy folder')

            const [_err] = await oO(
                fs.removeDir('felionpy', {
                    dir: fs.BaseDirectory.AppLocalData,
                    recursive: true,
                })
            )
            if (_err) return reject(`Could not delete the existing felionpy folder\n ${_err}`)
        }

        const currentplatform = await platform()
        const filepath = await path.appLocalDataDir()
        const zipfile = await path.join(filepath, filename)

        const args = {
            win32: ['Expand-Archive', '-Path', zipfile, '-DestinationPath', `${filepath}`, '-Force'],
            darwin: [zipfile, '-d', filepath],
        }

        const cmd = new shell.Command(`unzip-${currentplatform}`, args[currentplatform])

        let err: string
        const child = await cmd.spawn()

        outputbox.info(`unzip PID: ${child.pid}`)

        cmd.on('close', async () => {
            if (err) {
                footerMsg.set({ msg: 'failed to install assets', status: 'done' })
                outputbox.error('failed to UNZIP')
                reject('failed to UNZIP')
            } else {
                footerMsg.set({ msg: 'assets installation completed', status: 'done' })
                outputbox.success('UNZIP success')
                resolve('UNZIP success')

                await window.sleep(1000)
                await fs.removeFile(filename, { dir: fs.BaseDirectory.AppLocalData })
            }
            outputbox.warn('UNZIP process closed')
            python_asset_ready_to_install.set(false)

            await window.sleep(1000)
            await startServer()
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

export const check_assets_update = async (toast = false) => {
    if (!window.navigator.onLine) {
        if (toast) outputbox.warn('No internet connection')
        return Promise.resolve(false)
    }

    const URL = import.meta.env.VITE_FELIONPY_URL
    outputbox.info('checking for assets update...')

    const [_err1, response] = await oO(axios<{ tag_name: string }>(URL))
    if (_err1) {
        outputbox.error(_err1)
        return Promise.resolve(false)
    }

    if (response.status !== 200) {
        outputbox.error('Could not download the assets')
        return Promise.resolve(false)
    }
    current_release_data = response.data
    const { tag_name } = response.data

    outputbox.info(`Available version: ${tag_name}`)
    if (get(felionlibVersion)) {
        outputbox.info(`Current version: v${get(felionlibVersion)}`)
    } else {
        outputbox.error('Current version not determined yet.')
    }
    assets_version_available = tag_name
    const assets_download_needed = get(felionlibVersion) ? `v${get(felionlibVersion)}` < tag_name : true

    if (assets_download_needed) {
        outputbox.warn(`Download required`)
    } else {
        outputbox.warn(`Download not required`)
    }

    return Promise.resolve(assets_download_needed)
}

export const download_assets = async () => {
    const asset_name = `felionpy-${await platform()}.zip`

    if (!get(downloadoverrideURL)) {
        if (get(python_asset_ready_to_install)) {
            await unZIP(asset_name)
            return
        }

        let assets_download_needed: boolean
        if (!assets_version_available) {
            assets_download_needed = !(await check_assets_update())
        }

        if (assets_download_needed) {
            await downloadZIP(asset_name)
            return
        }

        // if (!(await dialog.confirm('Download not required', { title: 'Download anyway' }))) return
    }

    await downloadZIP(asset_name)
}
