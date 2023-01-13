import { pyVersion, felionlibVersion } from '$lib/pyserver/stores'
import computePy_func from '$lib/pyserver/computePy'
import { asset_download_required } from './stores'

export async function getPyVersion(e?: ButtonClickEvent) {
    const dataFromPython = await computePy_func<{ python: string; felionlib: string }>({
        e,
        target: e?.currentTarget,
        pyfile: 'getVersion',
        args: [''],
    })

    if (!dataFromPython) {
        window.createToast('Could not access pyfile', 'danger')
        console.warn({ dataFromPython })
        return
    }

    pyVersion.set(dataFromPython.python)
    felionlibVersion.set(dataFromPython.felionlib)

    if (get(felionlibVersion) < import.meta.env.VITE_FELIONPY_MIN_VERSION) {
        asset_download_required.set(true)
    }
}
