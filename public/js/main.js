function generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function generateRandomColors() {
    let colorsList = []
    for (const len of arguments) {
        let colors = []

        for (let i = 0; i < len; i++) {
            colors.push(generateRandomColor())
        }

        colorsList.push(colors)
    }

    return colorsList
}

async function buildGeoJSON(files, colors) {
    // the object to be returned
    let featureCollection = {
        type: 'FeatureCollection',
        features: []
    }

    // fetch files and add the same events the same color
    for (const eventIndex in files) {
        for (const geoJsonFile of files[eventIndex]) {
            // fetch geo json file from provided path
            const res = await fetch(geoJsonFile)
            let geoJson = res.json()
            // add styling information (all elements from one event have the same color)
            geoJson.style.fill = colors[eventIndex]
            // add to feature collection
            featureCollection.features.push(geoJson)
        }
    }

    return featureCollection
}

function getMarkerImage(event) {
    switch (event) {
        case 'Flood':
            return 'url(markers/flood.png)'
        default:
            ...
    }
}
