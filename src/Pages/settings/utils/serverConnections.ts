import { pyServerPORT, get } from '$lib/pyserver/stores'

type Target = EventTarget & HTMLButtonElement
type Port = { target?: Target; portNumber?: number }

export const fetchServerROOT = async ({ target, portNumber = get(pyServerPORT) }: Port) => {
    console.warn('fetching python server root')
    target?.classList.toggle('is-loading')
    try {
        const response = await fetch(`http://localhost:${portNumber}/`)
        const textresponse = await response.text()
        return Promise.resolve(textresponse)
    } catch (error) {
        if (error instanceof Error) {
            return Promise.resolve(error)
        } else {
            return Promise.resolve(new Error(error as string))
        }
    } finally {
        target?.classList.toggle('is-loading')
    }
}

export const isItfelionpy = async (portNumber: number = get(pyServerPORT)) => {
    const textresponse = await fetchServerROOT({ portNumber })
    return textresponse instanceof Error ? false : textresponse.includes('felionpy')
}
