
export function getInfoContents(fileContents: string) {

    const infoContents = fileContents
        .split('\n')
        .filter((line) => line.includes('#'))
        .map((line) => line.trim())
    
    const fileVariableComputedValues: {[name: string]: number} = {}
    
    infoContents.forEach((line) => {
        const processedLine = line
            .split('\t')
            .filter((ln) => ln.length)
            .map((ln) => ln.split('#')[1]?.trim())

        if (!processedLine[2] && !processedLine[3]) return
        fileVariableComputedValues[processedLine[2]] = +processedLine[3]
    })
    return fileVariableComputedValues
}
