export const PlanksConstant = 6.62607004e-34 // J.s
export const SpeedOfLight = 299792458 // m/s
export const boltzmanConstant = 1.38064852e-23 // in J.K-1
export const boltzmanConstantInHz = boltzmanConstant / PlanksConstant // in Hz.K-1
export const boltzmanConstantInMHz = boltzmanConstantInHz * 1e-6 // in Hz.K-1
export const boltzmanConstantInWavenumber = boltzmanConstantInHz / (SpeedOfLight * 100) // in cm-1
export const DebyeToCm = 3.336e-30 // C⋅m (for dipole moment)
export const VaccumPermitivity = 8.85418782e-12 // m-3 kg-1 s4 A2 or C2 J-1 m-1
export const amuToKG = 1.662e-27 // kg
export const electricCharge = 1.602176565e-19 // C
export const plt_styles = [
    'default',
    'Solarize_Light2',
    '_classic_test_patch',
    '_mpl-gallery',
    '_mpl-gallery-nogrid',
    'bmh',
    'classic',
    'dark_background',
    'fast',
    'fivethirtyeight',
    'ggplot',
    'grayscale',
    'seaborn',
    'seaborn-bright',
    'seaborn-colorblind',
    'seaborn-dark',
    'seaborn-dark-palette',
    'seaborn-darkgrid',
    'seaborn-deep',
    'seaborn-muted',
    'seaborn-notebook',
    'seaborn-paper',
    'seaborn-pastel',
    'seaborn-poster',
    'seaborn-talk',
    'seaborn-ticks',
    'seaborn-white',
    'seaborn-whitegrid',
    'tableau-colorblind10',
]
