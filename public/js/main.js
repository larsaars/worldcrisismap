// init url params
const urlParams = new URLSearchParams(window.location.search);

// get if is debug mode from url params
if (urlParams.get('debug') === 'true') {
    // if is, show js console on screen
    $('#logContainer').show();

    // show js console on screen
    // https://stackoverflow.com/a/50773729/5899585
    function rewireLoggingToElement(eleLocator, eleOverflowLocator, autoScroll) {
        function fixLoggingFunc(name) {
            console['old' + name] = console[name];
            console[name] = function (...arguments) {
                const output = produceOutput(name, arguments);
                const eleLog = eleLocator();

                if (autoScroll) {
                    const eleContainerLog = eleOverflowLocator();
                    const isScrolledToBottom = eleContainerLog.scrollHeight - eleContainerLog.clientHeight <= eleContainerLog.scrollTop + 1;
                    eleLog.innerHTML += output + '<br>';
                    if (isScrolledToBottom) {
                        eleContainerLog.scrollTop = eleContainerLog.scrollHeight - eleContainerLog.clientHeight;
                    }
                } else {
                    eleLog.innerHTML += output + '<br>';
                }

                console['old' + name].apply(undefined, arguments);
            };
        }

        function produceOutput(name, args) {
            return args.reduce((output, arg) => {
                return output +
                    '<span class="log-' + (typeof arg) + ' log-' + name + '">' +
                    (typeof arg === 'object' && (JSON || {}).stringify ? JSON.stringify(arg) : arg) +
                    '</span>&nbsp;';
            }, '');
        }

        fixLoggingFunc('log');
        fixLoggingFunc('debug');
        fixLoggingFunc('warn');
        fixLoggingFunc('error');
        fixLoggingFunc('info');
    }

    rewireLoggingToElement(
        () => document.getElementById('log'),
        () => document.getElementById('logContainer'), true);

    console.log('JS console displayed on screen');
}


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
    style: 'https://api.maptiler.com/maps/dataviz/style.json?key=FmkZcpxnyFTMyvbqcIqk',
    center: [0, 33],
    attributionControl: false,
    zoom: 2.2,
    minZoom: 2,
    maxZoom: 7.5,
});

$(window).resize(function () {
    map.resize();
});


// add about attribution to map
map.addControl(new maplibregl.AttributionControl({
    compact: false, customAttribution: '<a href="/helpful-links">Helpful Links</a> | <a href="/about">About &amp; Privacy</a>'
}), 'bottom-right');

// add controls to map (zoom etc)
map.addControl(new maplibregl.NavigationControl(), 'bottom-right');

// check for cookies and set checkboxes accordingly
// check first for control cookies
let onlyNewDataCookie = localStorage.getItem('onlyNewData');
let showEventDurationCookie = localStorage.getItem('showEventDuration');

// if they do not exist, create them with default values
if (showEventDurationCookie === null) {
    localStorage.setItem('showEventDuration', 'false');
    showEventDurationCookie = false;
} else {
    showEventDurationCookie = JSON.parse(showEventDurationCookie);
}

if (onlyNewDataCookie === null) {
    localStorage.setItem('onlyNewData', 'false');
    onlyNewDataCookie = false;
} else {
    onlyNewDataCookie = JSON.parse(onlyNewDataCookie);
}

// set the checkboxes accordingly
$('#showEventDurationCheckbox').prop('checked', showEventDurationCookie);
$('#onlyNewDataCheckbox').prop('checked', onlyNewDataCookie);

// then the source cookies
// these are the source cookie's default values
const sourceCookies = [true, true, false, false];

for (let i = 0; i < sourcesAvailable.length; i++) {
    // if cookie does not exist in local storage,
    // create with default value,
    // else get value from local storage
    let value = localStorage.getItem(sourcesAvailable[i]);

    if (!value) {
        localStorage.setItem(sourcesAvailable[i], String(sourceCookies[i]));
    } else {
        sourceCookies[i] = JSON.parse(value);
    }

    // set the checkbox accordingly
    $(`#${sourcesAvailable[i]}Checkbox`).prop('checked', sourceCookies[i]);
}

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

// all data variables (fill with as many nulls as sources are available)
let sourceData = [],
    sourceColors = [],
    sourceGeoJSON = [];

for (let i = 0; i < sourcesAvailable.length; i++) {
    sourceData[i] = null;
    sourceColors[i] = null;
    sourceGeoJSON[i] = null;
}

// start web worker
const worker = new Worker('/js/main-load-worker.js');

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

        // if is the first time on website, show tutorial
        if (!localStorage.getItem('tutorialShown')) {
            localStorage.setItem('tutorialShown', 'true');
            // perform the tutorial
            doTutorial();
        }

        // sort markers by date when all loaded for article list
        markers.sort((a, b) => b.date - a.date);

        // remove all elements from article list html
        $('#articlesList').empty();

        // update article list scroll state to zero
        articlesListScrollState = 0;

        // add list of articles to articlesList
        for (let i = 0; i < markers.length; i++) {
            // create the element and set the html
            const articleDiv = document.createElement('div');
            articleDiv.innerHTML = markers[i].articleDescription;

            // add class of article to be able to hide and show it on change of checkbox
            articleDiv.classList.add('article-' + markers[i].source);

            // add to articles list div
            $('#articlesList').append(articleDiv);
        }
    }
}

// get data from worker
worker.onmessage = async function (e) {
    // start loading anim
    setLoading(true);
    // get data variables from worker
    const [source, serverData, geoJSON, colors] = [e.data.source, e.data.serverData, e.data.geoJSON, e.data.colors];
    const sourceName = sourcesAvailable[source];

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

map.on('moveend', function () {
    // if map stopped moving from flying motion,
    // and is using geojson
    if (isFlying && useGeoJSON) {
        // perform blinking effect on the layer
        // (in order to make it more visible)
        blinkLayerAndMarker('marked-layer', selectedMarker);

        // update flying state again
        isFlying = false;
    }
});

// send data to worker; load variables only for needed cookies
// from the beginning loading is enabled
for (let i = 0; i < sourceCookies.length; i++) {
    if (sourceCookies[i]) {
        worker.postMessage({
            source: i,
            sourcesAvailable: sourcesAvailable,
            useGeoJSON: useGeoJSON,
            dateOfTimestamp: date,
            onlyNewData: onlyNewDataCookie,
            timestamp: timestamp
        });
        feedbacksAwaited++;
    }
}

// if no cookie is activated, set loading to false
if (feedbacksAwaited === 0) {
    setLoading(false);
}

// register on disaster and news checkbox listeners
// also update cookies
for (let source = 0; source < sourcesAvailable.length; source++) {
    const checkbox = sourcesAvailable[source];
    $(`#${checkbox}Checkbox`).change(function () {
        // set the cookie in the local storage
        localStorage.setItem(checkbox, String(this.checked));
        // and in the sourceCookies array
        sourceCookies[source] = this.checked;

        if (this.checked && sourceData[source] === null) {
            // start loading if is not loaded yet, else just toggle layer
            setLoading(true);
            worker.postMessage({
                source: source,
                sourcesAvailable: sourcesAvailable,
                useGeoJSON: useGeoJSON,
                dateOfTimestamp: date,
                onlyNewData: onlyNewDataCookie,
                timestamp: timestamp
            });
            feedbacksAwaited++;
        } else {
            // hide and remove items from article list accordingly (class is set)
            $('.article-' + source).toggle(this.checked);

            // update article list scroll state to zero
            articlesListScrollState = 0;

            // toggle the layer if information already loaded
            toggleLayer(map, markers, checkbox + '-layer', this.checked);
        }
    });
}

// add on map click listener
// for preventing popup from opening on click (only on hover)
map.on('click', event => {
    // in the case of the tutorial, do not the original action
    // but continue with the tutorial
    if (isTutorial) {
        isTutorial.next();
        return
    }


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
                openSideBar(marker);
            }

            // is marker is true
            isMarker = true;

            // break the loop
            break;
        }
    }

    // if this was no marker clicked, close sidebar and setting
    if (!isMarker) {
        closeSideBar();
        clickSettingsButton(true);
    }
});

// handle webgl context loss (on ie. memory errors, happens on smartphones onPause() sometimes) 
// Listen for WebGL context loss event.
map.on('webglcontextlost', function (event) {
    // show an alert and then erload the site
    window.alert('WebGL context lost (map not showing properly). The site is reloading.');
    window.location.reload();
});

