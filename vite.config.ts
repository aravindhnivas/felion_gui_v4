import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { join } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
const PACKAGE_ROOT = __dirname

export default defineConfig({
    plugins: [
        svelte(),
        AutoImport({
            imports: [
                'svelte',
                'svelte/store',
                'svelte/transition',
                { 'ts-try': ['tryF', 'isError'] },
                { '@zmotivat0r/o0': ['oO'] },
                { '@tauri-apps/api': ['fs', 'path', 'dialog', 'shell'] },
                { 'plotly.js-basic-dist': ['relayout', 'deleteTraces', 'react', 'addTraces'] },
                {
                    'tauri-plugin-log-api': [
                        ['trace', 'logTrace'],
                        ['info', 'logInfo'],
                        ['error', 'logError'],
                    ],
                },
            ],
            dts: './src/auto-imports.d.ts',
        }),
    ],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    // prevent vite from obscuring rust errors
    clearScreen: false,
    // tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
    },
    // to make use of `TAURI_DEBUG` and other env variables
    // https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
    envPrefix: ['VITE_', 'TAURI_'],
    build: {
        // Tauri supports es2021
        target: ['es2021', 'chrome100', 'safari13'],
        // don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        // produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_DEBUG,
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                manualChunks: {
                    winbox: ['winbox/src/js/winbox'],
                    interactjs: ['interactjs'],
                    yaml: ['yaml'],
                    'lodash-es': ['lodash-es'],
                    plotly: ['plotly.js-basic-dist'],
                },
            },
        },
    },
    resolve: {
        alias: {
            $src: join(PACKAGE_ROOT, 'src'),
            $lib: join(PACKAGE_ROOT, 'src/lib'),
        },
    },
})
