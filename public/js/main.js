// init url params
const urlParams = new URLSearchParams(window.location.search);

// get timestamp and validate to date if available
const timestamp = urlParams.get('ts');
let date = new Date()
if (timestamp) {
    date = new Date(Number(timestamp) * 1000);
    if (!(date.getTime() > 0)) {
        date = new Date()
    }
}


// init date picker
$(document).ready(function () {
    $('#datePicker').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        todayHighlight: true,
        startDate: '2011-04-19',
        startView: 0,
        maxViewMode: 2,
        endDate: '+0d',
    }).datepicker('setDate', date)
        .on('changeDate', function (e) {
            // get selected date
            const selectedDate = e.date;

            // if selected date is today, remove timestamp from url
            if (selectedDate.toDateString() === new Date().toDateString()) {
                window.location.href = window.location.pathname;
            } else {
                const timestamp = selectedDate.getTime() / 1000;

                // set timestamp in url
                urlParams.set('ts', String(timestamp));
                window.location.search = urlParams.toString();
            }
        });

});

// get map variable
let map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/streets/style.json?key=FmkZcpxnyFTMyvbqcIqk',
    center: [0, 33],
    zoom: 2.2,
    attributionControl: false
});

$(window).resize(function () {
    map.resize();
});


// add about attribution to map
map.addControl(new maplibregl.AttributionControl({
    compact: false,
    customAttribution: '<a href="/about">About</a>'
}), 'bottom-right');

// add controls to map (zoom etc)
map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

// list of markers for all events for hover functionality
let markers = [];

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

// variables for geo json
let disasterGeoJson, newsGeoJson;
let firstSymbolId;

map.on('load', async function () {
    let layers = map.getStyle().layers;
    // find the index of the first symbol layer in the map style
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }

    // geo json variables
    disasterGeoJson = await buildGeoJSON(disasterFiles, disasterColors, true);
    newsGeoJson = await buildGeoJSON(newsFiles, newsColors, false);

    // build sources from provided geo json files
    map.addSource('disasters', {
        'type': 'geojson',
        'data': disasterGeoJson
    });
    map.addSource('news', {
        'type': 'geojson',
        'data': newsGeoJson
    });

    // add news and disaster layer
    map.addLayer(
        {
            'id': 'disasters-layer',
            'type': 'fill',
            'source': 'disasters',
            'layout': {},
            'paint': {
                'fill-color': ['get', 'fill'],
                'fill-opacity': 0.33
            }
        },
        firstSymbolId
    );
    map.addLayer(
        {
            'id': 'news-layer',
            'type': 'fill',
            'source': 'news',
            'layout': {},
            'paint': {
                'fill-color': ['get', 'fill'],
                'fill-opacity': 0.33
            }
        },
        firstSymbolId
    );

    // add markers for every event to the map
    function addMarkers(dataList, colors, isDisaster) {
        for (const dataIndex in dataList) {
            const data = dataList[dataIndex];
            // define event type text
            const eventType = data.type ? data.type : 'News';

            // get marker image path
            const markerImagePath = getMarkerImagePath(eventType, useBlack(colors[dataIndex]));

            // create marker icon
            const markerIcon = document.createElement('div');
            markerIcon.style.width = '32px';
            markerIcon.style.height = '32px';
            markerIcon.style.backgroundSize = 'contain';
            markerIcon.style.backgroundImage = `url(${markerImagePath})`;
            markerIcon.style.cursor = 'pointer';
            markerIcon.style.backgroundColor = colors[dataIndex];
            markerIcon.style.borderRadius = '50%';
            markerIcon.style.border = '1px solid ' + colors[dataIndex];
            markerIcon.style.opacity = '0.72';

            // create marker with popup
            const marker = new maplibregl.Marker(markerIcon, {
                color: colors[dataIndex],
                draggable: false,
                anchor: 'center',
            }).setLngLat([data.lon, data.lat]);

            // set description attribute to marker to be used in sidebar text (with formatted date)
            const dateString = new Date(data.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            marker.description = `<div><img src="${markerImagePath.replace(/white/g, 'black')}" alt="event type" style="width: 2rem; height: 2rem; margin-bottom: 0.5rem"><br><i>`
                + eventType
                + '</i></div><p><small>'
                + dateString
                + '</small></p><h2>'
                + data.title
                + '</h2><br>'
                + data.description_html.replace(/&quot;/g, '"');

            // set color of marker to be used in sidebar text
            marker.color = colors[dataIndex];

            // set marker index for GeoJSON retrieval
            marker.eventIndex = dataIndex;
            marker.isDisaster = isDisaster;

            // set coords to marker
            marker.lat = data.lat;
            marker.lon = data.lon;

            // add to map
            marker.addTo(map);

            // and to the list of markers
            markers.push(marker);
        }
    }

    // call addMarkers for disaster and news markers
    addMarkers(disasterData, disasterColors, true);
    addMarkers(newsData, newsColors, false);

    // go through all markers and change the positions of those with the same coordinates
    for (const marker of markers) {
        // get all markers with the same coordinates
        const sameMarkers = markers.filter(m => m.lat === marker.lat && m.lon === marker.lon);

        // if there is more than one marker with the same coordinates
        if (sameMarkers.length > 1) {
            // get the index of the current marker
            const index = sameMarkers.indexOf(marker);

            // calculate the offset for the current marker
            const offset = 32 * (index - (sameMarkers.length - 1) / 2);

            // set the offset
            marker.setOffset([offset, 0]);
        }
    }

    // function for showing and hiding layers and their markers
    function toggleLayer(layerId, show) {
        map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');
        markers.filter(m => m.isDisaster === (layerId === 'disasters-layer')).forEach(m => m.getElement().style.display = show ? 'block' : 'none');
    }

    // check for cookies and set checkboxes accordingly
    const disasterCookie = getCookie('disaster');
    const newsCookie = getCookie('news');

    // if do not exist, set
    if (!disasterCookie) {
        setCookie('disaster', 'true', 365);
    }

    if (!newsCookie) {
        setCookie('news', 'true', 365);
    }

    // set checkboxes
    $('#disastersCheckbox').prop('checked', disasterCookie === 'true');
    $('#newsCheckbox').prop('checked', newsCookie === 'true');

    // check if layer checkboxes are checked. If not, hide the layer
    if (!$('#disastersCheckbox').is(':checked')) {
        toggleLayer('disasters-layer', false);
    }

    if (!$('#newsCheckbox').is(':checked')) {
        toggleLayer('news-layer', false);
    }


    // register on disaster and news checkbox listeners
    // also update cookies
    $('#disastersCheckbox').change(function () {
        toggleLayer('disasters-layer', this.checked);
        setCookie('disaster', this.checked, 365);
    });

    $('#newsCheckbox').change(function () {
        toggleLayer('news-layer', this.checked);
        setCookie('news', this.checked, 365);
    });

    // remove loading circle (finished loading)
    $('#earth').hide();
    // set loading false
    loading = false;
});


// add on map click listener
// for preventing popup from opening on click (only on hover)
map.on('click', event => {
    const target = event.originalEvent.target;

    // boolean if marker was clicked
    let isMarker = false;

    // find the marker clicked
    for (const marker of markers) {
        // on match
        if (marker.getElement().contains(target)) {
            // effect of marker click
            $(marker.getElement()).effect('highlight', {color: marker.color}, 100);

            // open sidebar with description
            if (marker === selectedMarker) {
                closeSideBar();
            } else {
                openSideBar(map, marker, marker.isDisaster ? disasterGeoJson : newsGeoJson);
            }

            // is marker is true
            isMarker = true;

            break;
        }
    }

    // if this was no marker clicked, close sidebar and settings
    if (!isMarker) {
        closeSideBar();
        clickSettingsButton(true);
    }
});

