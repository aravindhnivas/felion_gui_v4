import { get } from 'svelte/store'
import { customStore } from './stores/func'
export { get }

export const felixIndex = customStore([])
export const felixPeakTable = customStore<{ freq: number; amp: number; sig: number; id: string }[]>([])
export const felixOutputName = customStore('averaged')
export const opoMode = customStore(false)
export const Ngauss_sigma = customStore(5)

export interface DataTable {
    id: string
    name: string
    freq: number
    amp: number
    fwhm: number
    sig: number
    color: string
}

export const dataTable = customStore<DataTable[]>([])
export const dataTable_avg = customStore<DataTable[]>([])
export const frequencyDatas = customStore<DataTable[]>([])
export const fitted_data = customStore<{ [name: string]: DataTable[] }>({})

export const felixopoLocation = customStore('')
export const felixPlotAnnotations = customStore<Partial<Plotly.Annotations>[]>([])
export const expfittedLines = customStore<Plotly.Shape[]>([])
export const fittedTraceCount = customStore(0)
export const normMethods = ['Log', 'Relative', 'IntensityPerPhoton']

export const felixPlotWidgets = writable({
    text: [
        {
            label: 'Exp_title',
            value: 'FELIX-Experiment',
            id: window.getID(),
        },
        { label: 'Exp_legend', value: 'legend', id: window.getID() },
        { label: 'Cal_title', value: 'calc_title', id: window.getID() },
    ],

    number: [
        { label: 'freqScale', value: '1', id: window.getID() },
        { label: 'theorySigma', value: '5', id: window.getID() },
    ],
    boolean: [{ label: 'Only_exp', value: true, id: window.getID() }],
})

export const felixPlotCheckboxes = writable([
    {
        label: 'DAT_file',
        options: [],
        value: [],
        id: window.getID(),
    },
    {
        label: 'Fundamentals',
        options: [],
        value: [],
        id: window.getID(),
    },
    {
        label: 'Others',
        options: [],
        value: [],
        id: window.getID(),
    },
    {
        label: 'Overtones',
        options: [],
        value: [],
        id: window.getID(),
    },
    {
        label: 'Combinations',
        options: [],
        value: [],
        id: window.getID(),
    },
])

export const felix_peak_detection = customStore({
    threshold: 50,
    window: 4,
    filename: 'average',
})
