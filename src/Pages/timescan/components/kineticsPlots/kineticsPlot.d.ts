export as namespace KineticsPlot

export interface RateConstantProcessed {
    [key: string]: {
        [key: string]: {
            val: number[]
            std: number[]
            weighted_mean: string
            number_densities: {
                val: number[]
                std: number[]
            }
        }
    }
}

export interface RateConstantFitted {
    [key: string]: {
        [key: string]: {
            slope: string
            intercept: string
            fitX: number[]
            fitY: number[]
            ke: {
                val: number[]
                std: number[]
            }
            number_densities: {
                val: number[]
                std: number[]
            }
        }
    }
}
