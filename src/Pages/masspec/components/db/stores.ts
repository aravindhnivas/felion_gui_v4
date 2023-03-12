import fsm from 'svelte-fsm'
import Database, { type QueryResult } from 'tauri-plugin-sql-api'

export const DB = writable<Database>(null)

export const fields = {
    required: ['IE', 'source', 'precursor', 'temperature', 'pressure'],
    optional: ['keywords', 'notes'],
}

export const entry_values = persistentWritable('masspec-db-entry-values', {
    // export const entry_values = writable({
    filename: '',
    IE: '',
    source: 'storage',
    precursor: '',
    temperature: '',
    pressure: '',
    keywords: '',
    notes: '',

    reset: () => {
        entry_values.update((v) => {
            v.filename = ''
            v.IE = ''
            v.source = ''
            v.precursor = ''
            v.temperature = ''
            v.pressure = ''
            v.keywords = ''
            v.notes = ''
            return v
        })
    },
})

export const DBlocation = persistentWritable<string>('masspec-db-location', '')

export const DB_file = writable('')

export const save_to_db = async (file_location) => {
    if (get(status) !== 'connected') return

    if (!get(entry_values).filename) {
        await dialog.message('Please select a file', { title: 'Missing file', type: 'warning' })
        return
    }

    for (const field of fields.required) {
        if (!get(entry_values)[field]) {
            await dialog.message(`Please fill in the ${field} field`, { title: 'Missing field', type: 'warning' })
            return
        }
    }

    const db_massfiles_loc = await path.join(get(DBlocation), 'massfiles')

    if (!(await fs.exists(db_massfiles_loc))) {
        const [err] = await oO<void, string>(fs.createDir(db_massfiles_loc))
        if (err) return window.createToast(err, 'danger')
    }

    const src_file = await path.join(file_location, get(entry_values).filename)
    const dest_file = await path.join(db_massfiles_loc, get(entry_values).filename)
    if (await fs.exists(dest_file)) {
        const overwrite = await dialog.confirm('Do you want to overwrite the file?', {
            title: 'File already exists',
            type: 'warning',
        })
        if (!overwrite) return
    }

    const [err] = await oO<void, string>(fs.copyFile(src_file, dest_file))
    if (err) return window.createToast(err, 'danger')

    const [err1] = await oO<QueryResult, string>(
        get(DB).execute(
            `CREATE TABLE IF NOT EXISTS massfiles (
            filename TEXT PRIMARY KEY, 
            IE TEXT, 
            source TEXT, 
            precursor TEXT, 
            temperature TEXT, 
            pressure TEXT, 
            keywords TEXT, 
            notes TEXT
        )`
        )
    )
    if (err1) return window.createToast(err1, 'danger')

    const { filename, IE, source, precursor, temperature, pressure, keywords, notes } = get(entry_values)

    const [err2] = await oO<QueryResult, string>(
        get(DB).execute(
            `INSERT OR REPLACE INTO massfiles (
            filename, IE, source, precursor, temperature, pressure, keywords, notes
        ) VALUES 
        (
            '${filename}', '${IE}', '${source}', '${precursor}', 
            '${temperature}', '${pressure}', '${keywords}', '${notes}'
        )`
        )
    )
    if (err2) return window.createToast(err2, 'danger')
    window.createToast('File saved to database', 'success')
    return
}

export const status = fsm('disconnected', {
    disconnected: {
        _enter() {
            console.log('db disconnected')
        },
        connect: 'connecting',
    },

    connecting: {
        _enter() {
            console.log('connecting to db')
            fs.exists(get(DBlocation)).then((res) => {
                if (!res) return this.error()
                path.join(get(DBlocation), 'masspec.db').then(async (db_file) => {
                    try {
                        if (get(DB)) await get(DB).close()
                        const loc = `sqlite:${db_file}`
                        DB.set(await Database.load(loc))
                        return get(DB) ? this.success() : this.error()
                    } catch (err) {
                        window.createToast(err, 'danger')
                        this.error()
                    }
                })
            })
        },

        success: 'connected',

        error() {
            return 'retry'
        },
    },
    retry: {
        connect: 'connecting',
    },
    connected: {
        connect: 'connecting',

        check() {
            console.log('checking db connection')
            if (!get(DB)) return 'disconnected'
        },
    },
})

export const clear_db = async () => {
    if (get(status) !== 'connected') return
    const clear = await dialog.confirm('Are you sure you want to clear the database?', { title: 'Clear database' })
    if (!clear) return
    const [err] = await oO(get(DB).execute(`DELETE FROM massfiles`))
    if (err) return window.handleError(err)

    if (await fs.exists(get(DBlocation))) {
        const db_massfiles_loc = await path.join(get(DBlocation), 'massfiles')
        const [err] = await oO(fs.removeDir(db_massfiles_loc, { recursive: true }))
        if (err) return window.handleError(err)
    }
    window.createToast('Database cleared', 'success')
}

export const delete_from_db = async (filename) => {
    if (get(status) !== 'connected') return

    const delete_file = await dialog.confirm(`Are you sure you want to delete ${filename} ?`, {
        title: 'Delete file',
    })

    if (!delete_file) return window.createToast('File not deleted', 'danger')

    const [err] = await oO(get(DB).execute(`DELETE FROM massfiles WHERE filename = '${filename}'`))
    if (err) return window.handleError(err)

    if (await fs.exists(get(DBlocation))) {
        const db_filename = await path.join(get(DBlocation), 'massfiles', filename)
        if (!(await fs.exists(db_filename))) return window.createToast('File does not exist', 'danger')
        const [err] = await oO(fs.removeFile(db_filename))
        if (err) return window.handleError(err)
    }
    window.createToast('File deleted', 'success')
}
