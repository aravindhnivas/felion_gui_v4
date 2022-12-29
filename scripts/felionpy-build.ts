import { spawn } from 'child_process'
import path from 'path'

const cwd = path.resolve('./')

const resource = path.join(cwd, 'src-tauri/resources')
const icon = path.join(cwd, 'src-tauri/icons/icon.ico')
const pyfiles = path.join(cwd, 'src-python')
const hooks = path.join(pyfiles, 'hooks')
const mainfile = path.join(pyfiles, 'main.py')
const args =
    `--noconfirm --onedir --console --icon ${icon} --name felionpy --debug noarchive --noupx --additional-hooks-dir ${hooks} --hidden-import felionlib --paths ${pyfiles} --distpath ${resource} ${mainfile}`.split(
        ' '
    )
console.log(args)

const py = spawn('pyinstaller', args)
py.stdout.on('data', (data) => console.log(data.toString('utf8')))
py.stderr.on('data', (data) => console.log(data.toString('utf8')))
py.on('close', () => console.log('closed'))
py.on('error', (err) => console.log('error occured', err))
