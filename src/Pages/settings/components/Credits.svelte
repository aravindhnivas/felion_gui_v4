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
            primary: 'Iconify',
            secondary: ['Universal icon framework'],
            link: 'https://iconify.design/',
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

    const credits_python = [
        {
            primary: 'NumPy',
            secondary: ['The fundamental package for scientific computing with Python'],
            link: 'https://numpy.org/',
            id: window.getID(),
        },
        {
            primary: 'SciPy',
            secondary: ['Fundamental algorithms for scientific computing in Python'],
            link: 'https://scipy.org/',
            id: window.getID(),
        },
        {
            primary: 'uncertainties',
            secondary: [
                'cross-platform program that transparently handles calculations with numbers with uncertainties',
            ],
            link: 'https://pythonhosted.org/uncertainties/',
            id: window.getID(),
        },
        {
            primary: 'Matplotlib',
            secondary: ['Visualization with Python'],
            link: 'https://matplotlib.org/',
            id: window.getID(),
        },
        {
            primary: 'PyQt6',
            secondary: ['Python bindings for the Qt application framework'],
            link: 'https://www.riverbankcomputing.com/software/pyqt/',
            id: window.getID(),
        },
        {
            primary: 'Flask',
            secondary: ['micro web framework written in Python'],
            link: 'https://flask.palletsprojects.com/en/2.2.x/',
            id: window.getID(),
        },
        {
            primary: 'waitress',
            secondary: ['production-quality pure-Python WSGI server'],
            link: 'https://docs.pylonsproject.org/projects/waitress/en/stable/index.html',
            id: window.getID(),
        },
        {
            primary: 'PyInstaller ',
            secondary: ['PyInstaller bundles a Python application and all its dependencies into a single package.'],
            link: 'https://pyinstaller.org/en/stable/',
            id: window.getID(),
        },
    ]
</script>

<div class="animate__animated animate__fadeIn" class:hide={$currentTab !== 'Credits'}>
    <h1 class="mb-5">Credits</h1>

    <h1>Back-end: felionpy</h1>
    <ListsMultiline lists={credits_python} />
    <hr />
    <h1>Front-end</h1>
    <ListsMultiline lists={credits} />
</div>
