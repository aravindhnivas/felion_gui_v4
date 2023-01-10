import { pyVersion, felionlibVersion } from '$lib/pyserver/stores'
import computePy_func from '$lib/pyserver/computePy'
export async function getPyVersion(e?: ButtonClickEvent) {
    const dataFromPython = await computePy_func({
        e, target: e?.currentTarget,
        pyfile: 'getVersion', args: [""],
    })
    if (!dataFromPython) {
        window.createToast('Could not access pyfile', 'danger')
        console.warn({dataFromPython})
        return
    }
    
    pyVersion.set(dataFromPython.python)
    felionlibVersion.set(dataFromPython.felionlib)
}
