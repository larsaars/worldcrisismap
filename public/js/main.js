
function generateRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
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

// get the red, green and blue values
function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// decide whether white or black is better readable based on color
function useBlack(baseColor) {
    let rgb = hexToRgb(baseColor);
    let brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 150;
}

async function buildGeoJSON(files, colors) {
    // the object to be returned
    let featureCollection = {
        type: 'FeatureCollection',
        features: []
    };

    // fetch files and add the same events the same color
    for (const eventIndex in files) {
        for (const geoJsonFile of files[eventIndex]) {
            // fetch geo json file from provided path
            const res = await fetch(geoJsonFile);
            let geoJson = await res.json();

            // if the type is a feature list, add the features to the feature collection
            // else add the single feature to the feature collection
            let features = geoJson.type === 'FeatureCollection' ? geoJson.features : [geoJson];
            for (const feature of features) {
                // add styling information (all elements from one event have the same color)
                feature.properties = {};
                feature.properties.fill = colors[eventIndex];
                featureCollection.features.push(feature);
            }
        }
    }

    return featureCollection;
}

function getMarkerImage(event, useBlack) {
    const color = useBlack ? 'black' : 'white';
    return 'url(markers/' + color + '/' + event.toLowerCase().replace(' ', '_') + '.png)';
}

function openSideBar(text) {
    // set sidebar text
    $('#sidebarText').html(text);

    // set sidebar opened
    let sidebar = $('#sidebar');

    $('#main').css('marginLeft', '40%');
    sidebar.css('width', '40%');
    sidebar.show()
}

function closeSideBar() {
    // set sidebar is closed
    $('#main').css('marginLeft', '0%');
    $('#sidebar').hide()
}