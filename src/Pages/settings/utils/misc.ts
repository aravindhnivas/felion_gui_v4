export const toggle_loading = (node: HTMLButtonElement) => {
    if (!node) return
    node.classList.contains('is-loading') ? node.classList.remove('is-loading') : node.classList.add('is-loading')
}
