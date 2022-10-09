/*
SOURCES
0: disaster
1: report
2: news
 */

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

async function buildGeoJSON(files, colors, source) {
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
                    feature.properties.source = source;
                    // add the feature to the feature collection
                    featureCollection.features.push(feature);
                }
            }
        }
    ));


    return featureCollection;
}

self.addEventListener('message', async function (e) {

    // request the json from the server
    // only the needed source type is passed and timestamp
    const timestamp = e.data.timestamp ? e.data.timestamp : '0';
    const url = '/api/' + ['disaster', 'report', 'news'][e.data.source] + '/' + timestamp;

    // fetch the data from the server
    const res = await fetch(url);
    const serverData = await res.json();

    // get files from server data
    let files = [];

    // parse from json because they are passed as strings
    for (const data of serverData) {
        files.push(JSON.parse(data.geojson));
    }

    // generate colors for all events
    const [colors] = generateRandomColors(serverData.length);

    // build geo json from files
    const geoJSON = await buildGeoJSON(files, colors, 0);

    // send the geo json to the main thread (and the colors)
    self.postMessage({
        source: e.data.source,
        serverData: serverData,
        geoJSON: geoJSON,
        colors: colors
    });
});
