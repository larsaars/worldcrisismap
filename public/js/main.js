// init url params
const urlParams = new URLSearchParams(window.location.search);

// get timestamp and validate to date if available
const timestamp = urlParams.get('ts');
let date = new Date();
if (timestamp) {
    date = new Date(Number(timestamp) * 1000);
    if (!(date.getTime() > 0)) {
        date = new Date();
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
    compact: false, customAttribution: '<a href="/about">About</a>'
}), 'bottom-right');

// add controls to map (zoom etc)
map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

// list of markers for all events for hover functionality
let markers = [];

// start web worker
const worker = new Worker('/js/main-worker.js');

// send data to worker
worker.postMessage({
    'disasterData': disasterData,
    'reportData': reportData,
    'newsData': newsData,
});

// variables for geo json etc.
let disasterGeoJson, reportGeoJson, newsGeoJson, disasterColors, reportColors, newsColors;
let firstSymbolId;

// make map.on load a promise to be awaited
const mapLoaded = new Promise((resolve) => {
    map.on('load', resolve);
});

// get data from worker
worker.onmessage = async function (e) {
    // get data variables from worker
    [disasterGeoJson, reportGeoJson, newsGeoJson, disasterColors, reportColors, newsColors] = [
        e.data.disasterGeoJson,
        e.data.reportGeoJson,
        e.data.newsGeoJson,
        e.data.disasterColors,
        e.data.reportColors,
        e.data.newsColors,
    ];

    // wait for map to be loaded
    await mapLoaded;

    let layers = map.getStyle().layers;
    // find the index of the first symbol layer in the map style
    for (let i = 0; i < layers.length; i++) {
        if (layers[i].type === 'symbol') {
            firstSymbolId = layers[i].id;
            break;
        }
    }


    // build sources from provided geo json files
    map.addSource('disasters', {
        'type': 'geojson', 'data': disasterGeoJson
    });
    map.addSource('reports', {
        'type': 'geojson', 'data': reportGeoJson
    });
    map.addSource('news', {
        'type': 'geojson', 'data': newsGeoJson
    });

    // add news, report and  disaster layer
    map.addLayer({
        'id': 'disaster-layer', 'type': 'fill', 'source': 'disasters', 'layout': {}, 'paint': {
            'fill-color': ['get', 'fill'], 'fill-opacity': 0.33
        }
    }, firstSymbolId);
    map.addLayer({
        'id': 'report-layer', 'type': 'fill', 'source': 'reports', 'layout': {}, 'paint': {
            'fill-color': ['get', 'fill'], 'fill-opacity': 0.33
        }
    }, firstSymbolId);
    map.addLayer({
        'id': 'news-layer', 'type': 'fill', 'source': 'news', 'layout': {}, 'paint': {
            'fill-color': ['get', 'fill'], 'fill-opacity': 0.33
        }
    }, firstSymbolId);

    // add markers for every event to the map
    function addMarkers(dataList, colors, source) {
        for (const dataIndex in dataList) {
            const data = dataList[dataIndex];
            // define event name and type based on source and type
            const eventName = [data.type, 'ReliefWeb Report', 'IPS News Article'][source];
            const eventType = [data.type, 'Report', 'Report'][source];

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
                color: colors[dataIndex], draggable: false, anchor: 'center',
            }).setLngLat([data.lon, data.lat]);

            // set description attribute to marker to be used in sidebar text (with formatted date)
            const dateString = new Date(data.date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
            });

            marker.description = `<div><img src="${markerImagePath.replace(/white/g, 'black')}" alt="event type" style="width: 2rem; height: 2rem; margin-bottom: 0.5rem"><br><i>` + eventName + '</i></div><p><small>' + dateString + '</small></p><h2>' + data.title + '</h2><br>' + data.description_html.replace(/&quot;/g, '"');

            // set color of marker to be used in sidebar text
            marker.color = colors[dataIndex];

            // set marker index for GeoJSON retrieval
            marker.eventIndex = Number(dataIndex);
            marker.source = source;

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
    addMarkers(disasterData, disasterColors, 0);
    addMarkers(reportData, reportColors, 1);
    addMarkers(newsData, newsColors, 2);

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
        const layerNames = {
            0: 'disaster-layer',
            1: 'report-layer',
            2: 'news-layer',
        };
        markers.filter(m => layerId === layerNames[m.source]).forEach(m => m.getElement().style.display = show ? 'block' : 'none');
    }

    // check for cookies and set checkboxes accordingly
    let disasterCookie = getCookie('disaster');
    let reportCookie = getCookie('report');
    let newsCookie = getCookie('news');

    // if they do not exist, set
    if (!disasterCookie) {
        setCookie('disaster', 'true', 365);
        disasterCookie = 'true';
    }

    if (!reportCookie) {
        setCookie('report', 'true', 365);
        reportCookie = 'true';
    }

    if (!newsCookie) {
        setCookie('news', 'true', 365);
        newsCookie = 'true';
    }

    // set checkboxes
    $('#disasterCheckbox').prop('checked', disasterCookie === 'true');
    $('#reportCheckbox').prop('checked', reportCookie === 'true');
    $('#newsCheckbox').prop('checked', newsCookie === 'true');

    // check if layer checkboxes are checked. If not, hide the layer
    if (!$('#disasterCheckbox').is(':checked')) {
        toggleLayer('disaster-layer', false);
    }

    if (!$('#reportCheckbox').is(':checked')) {
        toggleLayer('report-layer', false);
    }

    if (!$('#newsCheckbox').is(':checked')) {
        toggleLayer('news-layer', false);
    }


    // register on disaster and news checkbox listeners
    // also update cookies
    $('#disasterCheckbox').change(function () {
        toggleLayer('disaster-layer', this.checked);
        setCookie('disaster', String(this.checked), 365);
    });

    $('#reportCheckbox').change(function () {
        toggleLayer('report-layer', this.checked);
        setCookie('report', String(this.checked), 365);
    });

    $('#newsCheckbox').change(function () {
        toggleLayer('news-layer', this.checked);
        setCookie('news', String(this.checked), 365);
    });

    // remove loading circle (finished loading)
    $('#earth').hide();
    // show settings
    $('#settings').animate({width: 'toggle', height: 'toggle'});
    // set loading false
    loading = false;
};


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
                const geoJsonSource = {
                    0: disasterGeoJson,
                    1: reportGeoJson,
                    2: newsGeoJson,
                };
                openSideBar(map, marker, geoJsonSource[marker.source]);
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

