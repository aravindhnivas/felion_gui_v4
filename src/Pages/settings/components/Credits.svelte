<script>
    import { currentTab } from '$lib/pyserver/stores'
    import { ListsMultiline } from '$src/components'
    const credits = [
        {
            primary: 'Tauri',
            secondary: [
                'Build an optimized, secure, and frontend-independent application for multi-platform deployment',
            ],
            link: 'https://tauri.app/',
            id: window.getID(),
        },

        {
            primary: 'Svelte',
            secondary: ['Cybernatically enhanced web apps'],
            link: 'https://svelte.dev/',
            id: window.getID(),
        },

        {
            primary: 'Vite',
            secondary: ['Next Generation Frontend Tooling'],
            link: 'https://vitejs.dev/',
            id: window.getID(),
        },

        {
            primary: 'Bulma',
            secondary: ['the modern CSS framework that just works'],
            link: 'https://bulma.io/',
            id: window.getID(),
        },

        {
            primary: 'Google fonts',
            secondary: ['Material Symbols and fonts'],
            link: 'https://fonts.google.com/icons/',
            id: window.getID(),
        },

        {
            primary: 'Plotly.js',
            secondary: ['JavaScript Open Source Graphing Library'],
            link: 'https://plotly.com/javascript/',
            id: window.getID(),
        },

        {
            primary: 'SMUI',
            secondary: ['Material UI components for Svelte apps'],
            link: 'https://sveltematerialui.com/',
            id: window.getID(),
        },

        {
            primary: 'Lodash',
            secondary: ['A modern JavaScript utility library delivering modularity, performance & extras'],
            link: 'https://lodash.com/',
            id: window.getID(),
        },

        {
            primary: 'Lordicons',
            secondary: ['Animated icons by Lordicon.com'],
            link: 'https://lordicon.com/',
            id: window.getID(),
        },

        {
            primary: 'Animate.css',
            secondary: ['Just-add-water CSS animations'],
            id: window.getID(),
        },

        {
            primary: 'Hover.css',
            secondary: ['A collection of CSS3 powered hover effects'],
            link: 'https://github.com/IanLunn/Hover',
            id: window.getID(),
        },

        {
            primary: 'Cooltipz.css',
            secondary: ['Cool customisable tooltips made from pure CSS'],
            link: 'https://github.com/jackdomleo7/Cooltipz.css',
            id: window.getID(),
        },
    ]
</script>

<div class="animate__animated animate__fadeIn" class:hide={$currentTab !== 'Credits'}>
    <h1>Credits</h1>
    <div class="credits__div">
        <ListsMultiline lists={credits} />
    </div>
</div>

<style>
    .credits__div {
        display: grid;
        max-height: 75vh;
        overflow: auto;
    }
</style>
