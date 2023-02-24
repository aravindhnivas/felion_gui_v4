import type { SvelteToastOptions } from '@zerodevx/svelte-toast'

const felix_opo_data_from_python = <const>['SA', 'pow', 'base', 'average', 'average_per_photon', 'average_rel']
declare global {
    type PlotData = Partial<Plotly.PlotData>
    interface DataFromPython {
        [key: string]: PlotData
    }
    type FELIXData = Record<(typeof felix_opo_data_from_python)[number], DataFromPython>

    type OPOData = Omit<FELIXData, 'SA'>

    type ButtonClickEvent =
        | MouseEvent
        | (MouseEvent & {
              currentTarget: EventTarget & HTMLButtonElement
          })

    interface OnlyValueLabel<T = string> {
        value: T
        label: string
    }
    interface ValueLabel<T = string> {
        value: T
        label: string
        step?: string
        id: string
    }

    type KeyStringObj<T = string> = { [key: string]: T }

    type persistentDB<T> = ReturnType<typeof window.persistentDB<T>>

    interface Exposed {
        createToast: typeof import('../src/js/functions').createToast
        handleError: typeof import('../src/js/functions').handleError
        sleep: (ms: number) => Promise<void>
        tempdirPath: string
        currentPlatform: string
        getID: () => string
        error: unknown
    }
    interface Window extends Exposed {}
    interface OutputBoxtype {
        value: string
        type: 'info' | 'danger' | 'warning' | 'success'
    }

    interface NumberDensityConfigType {
        trap_temperature: number[]
        background_pressure: string[]
        added_pressure: string[]
        calibration_factor: number[]
        srgMode: boolean
        tube_diameter: number[]
        room_temperature?: number[]
        TakaishiSensuiConstants?: {
            A: number[]
            B: number[]
            C: number[]
        }
        F: string
        X: string
        nHe: string
        nHe_transpiration: string
    }

    interface NumberDensityInputType {
        srgMode: boolean
        added_pressure: string | number
        trap_temperature: string | number
        background_pressure: string | number
        calibration_factor: string | number
    }
}
