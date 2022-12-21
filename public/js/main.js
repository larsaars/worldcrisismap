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
    compact: false, customAttribution: '<a href="/about">About &amp; Privacy</a>'
}), 'bottom-right');

// add controls to map (zoom etc)
map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

// check for cookies and set checkboxes accordingly
let disasterCookie = localStorage.getItem('disaster');
let reportCookie = localStorage.getItem('report');
let newsCookie = localStorage.getItem('news');
let showEventDurationCookie = localStorage.getItem('showEventDuration');
let onlyNewDataCookie = localStorage.getItem('onlyNewData');

// if they do not exist, set
if (!disasterCookie) {
    localStorage.setItem('disaster', 'true');
    disasterCookie = 'true';
}

if (!reportCookie) {
    localStorage.setItem('report', 'true');
    reportCookie = 'true';
}

if (!newsCookie) {
    localStorage.setItem('news', 'true');
    newsCookie = 'true';
}

if (!showEventDurationCookie) {
    localStorage.setItem('showEventDuration', 'false');
    showEventDurationCookie = 'false';
}

if (!onlyNewDataCookie) {
    localStorage.setItem('onlyNewData', 'false');
    onlyNewDataCookie = 'false';
}

// set checkboxes
$('#disasterCheckbox').prop('checked', disasterCookie === 'true');
$('#reportCheckbox').prop('checked', reportCookie === 'true');
$('#newsCheckbox').prop('checked', newsCookie === 'true');
$('#showEventDurationCheckbox').prop('checked', showEventDurationCookie === 'true');
$('#onlyNewDataCheckbox').prop('checked', onlyNewDataCookie === 'true');

// add event listener to event duration checkbox
$('#showEventDurationCheckbox').change(function () {
    localStorage.setItem('showEventDuration', this.checked);
    $('.eventDuration').toggle(this.checked);
});

// add event listener to events only n days old checkbox
$('#onlyNewDataCheckbox').change(function () {
    localStorage.setItem('onlyNewData', this.checked);
    // and reload page
    window.location.reload();
});

// hide news checkbox if timestamp is set
if (timestamp) {
    $('#newsCheckboxDiv').hide();
}


// list of markers for all events for hover functionality
let markers = [];

// the highest symbol id of the map
let firstSymbolId;

// number of feedbacks awaited to be loaded
let feedbacksAwaited = 0;

// all data variables
let sourceData = [null, null, null];
let sourceColors = [null, null, null];
let sourceGeoJSON = [null, null, null];

// start web worker
const worker = new Worker('/js/main-load-worker.min.js');

// make map.on load a promise to be awaited
const mapLoaded = new Promise((resolve) => {
    map.on('load', resolve);
});


// function that gets called when a feedback has been received,
// even a not wished one (error)
function feedbackReceived() {
    // feedbacks awaited is decreased
    feedbacksAwaited--;

    // if all feedbacks are loaded, stop loading anim
    if (feedbacksAwaited === 0) {
        setLoading(false);

        // if is the first time on website, show settings
        if (!localStorage.getItem('settingsShown')) {
            clickSettingsButton(null);
            localStorage.setItem('settingsShown', 'true');
        }
    }
}

// get data from worker
worker.onmessage = async function (e) {
    // start loading anim
    setLoading(true);
    // get data variables from worker
    const [source, serverData, geoJSON, colors] = [e.data.source, e.data.serverData, e.data.geoJSON, e.data.colors];
    const sourceName = ['disaster', 'report', 'news'][source];

    // set data variables
    sourceData[source] = serverData;
    sourceGeoJSON[source] = geoJSON;
    sourceColors[source] = colors;

    // wait for map to be loaded (if is not)
    await mapLoaded;

    // build sources from provided geo json files if uses geojson
    if (useGeoJSON) {
        // determine firstSymbolId if not calculated yet
        if (!firstSymbolId) {
            let layers = map.getStyle().layers;
            // find the index of the first symbol layer in the map style
            for (let i = 0; i < layers.length; i++) {
                if (layers[i].type === 'symbol') {
                    firstSymbolId = layers[i].id;
                    break;
                }
            }
        }

        map.addSource(sourceName, {
            'type': 'geojson', 'data': geoJSON
        });

        // add layer from provided data
        map.addLayer({
            'id': sourceName + '-layer', 'type': 'fill', 'source': sourceName, 'layout': {}, 'paint': {
                'fill-color': ['get', 'fill'], 'fill-opacity': 0.32
            }
        }, firstSymbolId);
    }

    // add markers for event to the map
    addMarkers(map, markers, serverData, colors, source);

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

    // feedback received, stop loading anim if all feedbacks are received
    feedbackReceived();
};

// add also an error event listener
worker.onerror = function (e) {
    console.error(e);

    // but this is also a feedback, even if not a wished one
    // so call feedbackReceived
    feedbackReceived();
};

// send data to worker; load variables only for needed cookies
// from the beginning loading is enabled
if (disasterCookie === 'true') {
    worker.postMessage({source: 0, useGeoJSON: useGeoJSON,dateOfTimestamp: date,  onlyNewData: onlyNewDataCookie, timestamp: timestamp});
    feedbacksAwaited++;
}

if (reportCookie === 'true') {
    worker.postMessage({source: 1, useGeoJSON: useGeoJSON, dateOfTimestamp: date,  onlyNewData: onlyNewDataCookie, timestamp: timestamp});
    feedbacksAwaited++;
}

if (newsCookie === 'true') {
    worker.postMessage({source: 2, useGeoJSON: useGeoJSON, dateOfTimestamp: date,  onlyNewData: onlyNewDataCookie, timestamp: timestamp});
    feedbacksAwaited++;
}

// if no cookie is activated, set loading to false
if (feedbacksAwaited === 0) {
    setLoading(false);
}

// register on disaster and news checkbox listeners
// also update cookies
for (const checkbox of ['disaster', 'report', 'news']) {
    $(`#${checkbox}Checkbox`).change(function () {
        // set the cookie
        localStorage.setItem(checkbox, String(this.checked));

        // get source
        const source = ['disaster', 'report', 'news'].indexOf(checkbox);

        if (this.checked && sourceData[source] === null) {
            // start loading if is not loaded yet, else just toggle layer
            setLoading(true);
            worker.postMessage({source: source, useGeoJSON: useGeoJSON, dateOfTimestamp: date, onlyNewData: onlyNewDataCookie, timestamp: timestamp});
            feedbacksAwaited++;
        } else {
            toggleLayer(map, markers, checkbox + '-layer', this.checked);
        }
    });
}

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
                openSideBar(map, marker, sourceGeoJSON[marker.source]);
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

