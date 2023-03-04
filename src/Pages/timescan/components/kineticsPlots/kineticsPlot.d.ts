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
            val: number[]
            std: number[]
            slope: string
            intercept: string
            number_densities: {
                val: number[]
                std: number[]
            }
        }
    }
}
