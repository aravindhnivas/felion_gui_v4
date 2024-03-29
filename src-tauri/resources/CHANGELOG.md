# CHANGELOG

## 4.11.2

- Major changes in multi-Gaussian fit method
- Segment buttons style update
- other minor changes and bug fixes

## 4.11.1

- Multi Gaussian fit bug fix

## 4.11.0

- New feature: Peak finder for FELIX and OPO plots

---

## 4.10.1

- Masspec peaks plot
  - New features added
  - Changed initial threshold and peak width value
  - Optional masspec peaks plot
  - Masspec peaks dasheddot line added

- Plots are changed to non-editable layouts

## v4.10.0

- Loading screen added
- New feature: Masspec normalization
- Minor bug fixes

---

## v4.9.4

- Masspec DB bug fix
- Masspec DB code improvements
- Bug fix on server start and stop

## v4.9.3

- Single instance lock added (only one instance of the app can run at a time)
- Masspec DB auto close on app close
- Masspec DB bug fix when plotting

## v4.9.2

- Masspec DB bug fix
- multiple file selection on masspec DB

## v4.9.1

- Package updates

## v4.9.0

- New feature: Masspectrum sqlite database (massfiles.db) added

---

## v4.8.6

- code improvements on kinetics plots
- new toast notification

## v4.8.5

- major bug fixes on kinetics plots

## v4.8.4

- code improvements on kinetics plots
- update check bug fix

## v4.8.3

- major bug fixes on kinetics
- file select/text toggle bug fix
- code improvements

## v4.8.2

- minor bug fixes

## v4.8.1

- Kinetics plots - write to txt file
- cargo updates
- Clean up unused lottie icons

## v4.8.0

- Kinetic update: weighted mean and std calculation method
- Kinetics: bug fixes
- Features
  - App size reduced (including only required APIs)

---

## v4.7.0

- Code improvement and bug fixes

---

## v4.6.2

- Package and security updates

## v4.6.1

- Feature: kinetics plot improved

## v4.6.0

- Feature: kinetics plot (plotly) added
- BUG FIX: kinetocs rate constant fitting

---

## v4.5.1

- BUG FIX: felionpy min-version download

## v4.5.0

- Kinetics code improvements
- Requires minimum felionpy ^0.3.0

---

## v4.4.0

- BUG FIX and improvements on update-checking mechanism

---

## v4.3.0

- Auti-install assets after restart

---

## v4.2.2

- New window for output-box (outputs from felionpy)

## v4.2.1

- Bug fix: STARTserver on app starting

## v4.2.0

- New features
  - Multi tab feature for Normline, Masspec, Timescan and THz mode
  - Toggle rows and full screen advantage in main layout
  - Normline different mode (FELIX or OPO) at topbar
- System update
  - Python 3.11
  - GUI and felionpy is independently developed and not integrated with the bundle
  - Electron.js is replaced with Tauri.js (based on Rust)
- Bug fixes

---

## v3.8.1

- Browse locations added for OPO and theory rows (Normline)
- Minor bug fixes (OPO mode)
- Label corrections (cm/s -> m/s for speed of light)

## v3.8.0

- Added Features
  - Kinetics channels construction
  - Kinetics number density and configs file save options
  - THz simulation (as a function of k3_branch, number density and power all combined)
  - THz simulation updates (saving output file and figures options)
- BUG FIX:
  - Kinetics scan keyFound error
  - Lots of bug fixes on kinetics and THz simulations

---

## v3.7.0

- Added features
  - Kinetics: subplot adjust
  - Kinetics: configs in configs folder
  - kinetics: *.config.json,*.params.json, *.fit.json added feature
  - kinetics: choosing solve_ivp and curve_fit methods in the widget

- BUG FIX:
  - Timescan saveData (fitted_values) from slider
  - Timescan error-value now exports with min value=0.1 (to avoid sigma error in curve_fit);
  - kinetics-timescan: kinetic editor filename two-way binding fix
  - kinetics: bounds is not constrained when it is set to False

  - ROSAA: qapp.exec is None error while in variable plot mode

---

## v3.6.2

- Timescan Kinetics feature added:
  - toggle masses to include in the model

- BUG FIXES:
  - file browser multiple resizable event trigger
  - baseline marked file selection (when switching btw OPO and FELIX)
  - update error display
  - baseline ydata corrections

## v3.6.1

- BUG FIX: baseline list min method attribute error

## v3.6.0

- Major improvements and bug fixes
- using flask python server to communiate transfer (JSON) from python (Need local network port access so give it when prompted)
- Replacing FELion_Tk (Tkinter3) with felionQt (PyQt6)
- Updated packages (check about page)

---

## v3.5.3

- Normline
  - Individula plot selection

- THz:
  - Different fit profile
  - Individual plot selection

## v3.5.2

- Update bug fixes

## v3.5.1

- Kinetics (New page added)
- Timescan
  - Kinetic model implementation (TkFigure widget, save fit data, etc)
  - .scan file data analysed and exported in JSON format in EXPORT directory
- THz:
  - Full working THz-ROSAA kinetic model

- Major changes in program features:
  - Update from github realease
  - using vite for development and production build (instant HMR)
  - Removed db.json for electron-store module
  - Using executable python scripts instead of full python packages (safer and faster)
- Several bug fixes

## v3.5.0

- Plotly bug fix (Plotly is not included in window object)
- Masspec:
  - Getlabview setting can be varied to show only selected files or full files list
  - Masspectrum can now annotate a peak position (ctrl + left click) and delete annotation (ctrl + shift + left click)
- THz scans
  - Mention the number of iteration to be considered (useful in case you stopped the scan); write # iterations = number to be taken in the first line of the file
- Program updates
  - elctron-updater integrated with github as provider
  - node API changed to preload js for electron-v14 (more secure and needed for future electron updates)
  - lot of bug fixes and improvements

---

## v3.4.0

- ROSAA modal integrated.
- ROSAA kinetics integrated.
- Individual file selection for baseline correction.
- several bug fixes.
- several minor feature updates included.

---

## v3.3.2

- Bug fix for wrong trap time in felix file
  - nshots will be taken from pow file if trap time in felix file is very large >50s.

## v3.3.1

- Bug fix: OPO mode

## v3.3.0

- Feature updates:
  - New window for FELIX plotting (usefull for smaller screens)
  - While refreshing to get files, the selected files remains checked
  - PNotify integrated
  - WinBox.js modal integraeted
  - db.json replaced localStorage for saving data.
- Bug fixes

---

## v3.2.0

- Feature updates:
  - GetLabviewSettings updated
  - Theory vs Exp. feature udpated
  - Select files in file explorer by range (untill) using shift key

- Bug fixed:
  - OPO create baseline doesn't work unless felix files are selected.
  - GetLabviewSetings bqlenses label order were reversed.
  - Table width auto overflow.

  - Theory plot with OPO mode.
  - Files refresh button added to FELIX matplotlib modal.

---

## v3.1.1

- Bug fix: Masspec

## v3.1.0

- ROSAA simulation modal added.
- Individual page components are subdivided into smaller components for easier mangement and debugging.
- Included Terminal component in Setings for installing python dependencies and debugging.
- Included FELIX plotting in matplotlib to produce quality plots for exporting.
- Event dispatcher added for python process.
- Using Quill editor for report editor.
- Bug fix: Depletion scan dropdown menu auto updated
- Get labview settings from Masspec files

---
