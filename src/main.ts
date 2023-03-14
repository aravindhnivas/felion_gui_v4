const target = document.getElementById('app')
target.innerHTML = ''
import App from './App.svelte'
import 'uno.css'
import './js/functions'
import './App.scss'
export default new App({ target })
