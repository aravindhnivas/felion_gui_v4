import fsm from 'svelte-fsm'

export const fields = {
    required: ['IE', 'source', 'precursor', 'temperature', 'pressure'],
    optional: ['keywords', 'notes'],
}

// export const entry_values = persistentWritable('masspec-db-entry-values', {

export const entry_values = writable({
    filename: '',
    IE: '',
    source: '',
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

export const DBlocation = persistentWritable<string>(
    'masspec-db-location',
    '//felixdisk.science.ru.nl/felixshare2/22pole_iontrap-exchange/Students/Aravindh/MasspecDB'
)

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

    const db_file_location = await path.join(get(DBlocation), 'massfiles')
    if (!(await fs.exists(db_file_location))) {
        const [err] = await oO(fs.createDir(db_file_location))
        if (err) return toast.error(err as string)
    }

    const src_file = await path.join(file_location, get(entry_values).filename)
    const dest_file = await path.join(db_file_location, get(entry_values).filename)

    if (await fs.exists(dest_file)) {
        const overwrite = await dialog.confirm('Do you want to overwrite the file?', {
            title: 'File already exists',
            type: 'warning',
        })

        if (!overwrite) return
    }

    const [err] = await oO(fs.copyFile(src_file, dest_file))
    if (err) return toast.error(err as string)

    return toast.success('File saved to database')
}

export const status = fsm('disconnected', {
    disconnected: {
        submit: 'connecting',
    },
    connecting: {
        _enter() {
            fs.exists(get(DBlocation)).then((res) => (res ? this.success() : this.error()))
        },

        success: 'connected',
        error() {
            return 'retry'
        },
    },
    retry: {
        submit: 'connecting',
    },
    connected: {
        submit: 'connecting',
    },
})
