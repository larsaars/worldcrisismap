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
	    if (geoJsonFilesList) { 
                // fetch geo json from provided path, check first if cached, else fetch and cache
                const geoJsons = await Promise.all(geoJsonFilesList.map(async (geoJsonFile) => {
                    try {
                        const response = await fetch('/' + geoJsonFile, {cache: 'force-cache'});
                        return await response.json();
                    } catch (e) {
                        console.error(e);
                        console.error('Error finding or parsing geojson file: ' + geoJsonFile);
                    }

                    // return empty object instead of nothing in case of error
                    return {};

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
	    } else {
                // geoJsonFilesList is null, return empty
                return {};
            }
        }
    ));


    return featureCollection;
}

self.addEventListener('message', async function (e) {

    if (!e.data) {
        return;
    }

    // request the json from the server
    // only the needed source type is passed and timestamp (as well as date)
    const timestamp = e.data.timestamp ? e.data.timestamp : '0';
    const useGeoJSON = e.data.useGeoJSON;
    const dateOfTimestamp = e.data.dateOfTimestamp;
    const onlyNewData = e.data.onlyNewData === 'true' ? 'new' : 'all';
    const url = '/api/data/' + ['disaster', 'report', 'news'][e.data.source] + '/' + onlyNewData + '/' + timestamp;

    // fetch the data from the server
    const res = await fetch(url);
    const serverData = await res.json();

    // get files from server data
    let files = [];

    for (const data of serverData) {
        // calculate the days that have passed since the event for each event of serverData (set it there also as variable)
        data.daysSinceEvent = Math.floor((dateOfTimestamp - new Date(data.date)) / 86400000);
        // parse from json because they are passed as strings if using geojson
        if (useGeoJSON) {
            files.push(JSON.parse(data.geojson));
        }
    }

    // generate colors for all events
    const [colors] = generateRandomColors(serverData.length);

    // build geo json from files if using geojson
    const geoJSON = useGeoJSON ? await buildGeoJSON(files, colors, e.data.source) : null;

    // send the geo json to the main thread (and the colors)
    self.postMessage({
        source: e.data.source,
        serverData: serverData,
        geoJSON: geoJSON,
        colors: colors
    });
});
