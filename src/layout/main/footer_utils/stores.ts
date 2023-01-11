export const footerMsg = writable<{ status: 'idle' | 'running' | 'done'; msg: string }>({ status: 'idle', msg: '' })
