export as namespace Timescan;

export type PlotData  = Pick<Plotly.PlotData, "x" | "y"> & {
    error_y: {
        array: number[];
    };
};
export interface Data {
    SUM: PlotData;
    [mass: string]: PlotData;
}

export interface MassKey {
    mass: string
    id: string
    included: boolean
}

export interface LossChannel {
    type: string
    name: string
    lossFrom: string
    attachTo: string
    id: string
    numberDensity?: string
    sliderController?: string
}
