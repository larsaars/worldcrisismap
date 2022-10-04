function generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function generateRandomColors() {
    let colorsList = [];
    for (const len of arguments) {
        let colors = [];

        for (let i = 0; i < len; i++) {
            colors.push(generateRandomColor());
        }

        colorsList.push(colors);
    }

    return colorsList;
}

async function buildGeoJSON(files, colors, isDisaster) {
    // the object to be returned
    let featureCollection = {
        type: 'FeatureCollection', features: []
    };

    // iterate over all files
    await Promise.all(files.map(async (geoJsonFilesList, eventIndex) => {
            // fetch geo json from provided path
            const geoJsons = await Promise.all(geoJsonFilesList.map(async (geoJsonFile) => {
                const res = await fetch('/' + geoJsonFile);
                return await res.json();
            }));

            // iterate over geoJsons
            for (const geoJson of geoJsons) {
                // if the type is a feature list, add the features to the feature collection
                // else add the single feature to the feature collection
                let features = geoJson.type === 'FeatureCollection' ? geoJson.features : [geoJson];
                for (const feature of features) {
                    // add styling information (all elements from one event have the same color)
                    feature.properties = {};
                    feature.properties.fill = colors[eventIndex];
                    // add information about the event to the feature
                    feature.properties.eventIndex = eventIndex;
                    feature.properties.isDisaster = isDisaster;
                    // add the feature to the feature collection
                    featureCollection.features.push(feature);
                }
            }
        }
    ));


    return featureCollection;
}

self.addEventListener('message', async function (e) {

    // news and disaster data have been sent
    const disasterData = e.data.disasterData;
    const newsData = e.data.newsData;

    // get disaster and news files from the server data
    let disasterFiles = [], newsFiles = [];

    // parse from json because they are passed as strings
    for (const data of disasterData) {
        disasterFiles.push(JSON.parse(data.geojson));
    }

    for (const data of newsData) {
        newsFiles.push(JSON.parse(data.geojson));
    }
    // generate colors for all events
    const [disasterColors, newsColors] = generateRandomColors(disasterData.length, newsData.length);

    // geo json variables
    disasterGeoJson = await buildGeoJSON(disasterFiles, disasterColors, true);
    newsGeoJson = await buildGeoJSON(newsFiles, newsColors, false);

    // send the geo json to the main thread (and the colors)
    self.postMessage({
        disasterGeoJson: disasterGeoJson,
        newsGeoJson: newsGeoJson,
        disasterColors: disasterColors,
        newsColors: newsColors,
    });
});

