import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { join } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import { presetIcons, presetAttributify, presetUno, extractorSvelte } from 'unocss'

const PACKAGE_ROOT = __dirname

export default defineConfig({
    plugins: [
        UnoCSS({
            extractors: [extractorSvelte],
            presets: [
                presetIcons({
                    scale: 2,
                    extraProperties: {
                        cursor: 'pointer',
                    },
                }),
                presetAttributify({
                    /* preset options */
                }),
                presetUno(),
                // ...custom presets
            ],
        }),
        svelte(),
        AutoImport({
            imports: [
                'svelte',
                'svelte/store',
                'svelte/transition',
                {
                    axios: [
                        ['default', 'axios'], // import { default as axios } from 'axios',
                    ],
                    '@zmotivat0r/o0': ['oO'],
                    'ts-try': ['tryF', 'isError'],
                    '@tauri-apps/api/os': ['platform'],
                    'svelte-french-toast': ['toast'],
                    '$src/js/functions': ['sleep', 'toggle_loading'],
                    '$src/js/persistentStore': ['persistentWritable'],
                    '@tauri-apps/api': ['fs', 'path', 'dialog', 'shell'],
                    '$src/layout/main/footer_utils/stores': ['footerMsg'],
                    '$src/js/utils': ['get_nominal_value', 'get_std_value'],
                    'plotly.js-basic-dist': ['relayout', 'deleteTraces', 'react', 'addTraces'],
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
