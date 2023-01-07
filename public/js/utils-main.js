// global bool if sidebar is open
let sidebarIsClosed = true, selectedMarker = null, lastSelectedMarker = null;
// global variable for settings
let settingsOpened = false;
// global variable if is loading
let loading = true;
// global variable if datepicker div has been animated, if so, show it again on sidebar close
let datePickerDivHiddenOnSidebar = false;
// global variable if uses geoJSON
let useGeoJSON;

// the articles list scroll state
let articlesListScrollState = 0;


// detect if page is in mobile format or mobile phone
// call every time newly because window can be resized
function pageIsMobileFormat() {
    return ($(window).innerHeight() / $(window).innerWidth()) >= 1.4;
}

// init  directly on start, if page is mobile format, don't use geo json
// for the whole session
useGeoJSON = !pageIsMobileFormat();

// set loading show or not
function setLoading(isLoading) {
    // do nothing if state is already set
    if (isLoading === loading) {
        return;
    }

    // show or hide earth
    if (isLoading) {
        $('#earth').show();
    } else {
        $('#earth').hide();
    }

    // animate show settings or hide
    $('#settings').animate({width: 'toggle', height: 'toggle'});

    // the same with articles list button
    $('#articlesButtonDiv').animate({width: 'toggle'});

    // set variable
    loading = isLoading;
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
        r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16)
    } : null;
}

// decide whether white or black is better readable based on color
function useBlack(baseColor) {
    let rgb = hexToRgb(baseColor);
    let brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 150;
}

function getGeoJSONFromEvent(geoJSON, eventIndex) {
    // the object to be returned
    let featureCollection = {
        type: 'FeatureCollection', features: []
    };

    // retrieve all features from the geoJSON that have the eventIndex property
    for (const feature of geoJSON.features) {
        if (feature.properties.eventIndex === eventIndex) {
            featureCollection.features.push(feature);
        }
    }

    return featureCollection;
}

function getMarkerImagePath(event, useBlack) {
    const color = useBlack ? 'black' : 'white';
    return '/markers/' + color + '/' + event.toLowerCase().replace(/ /g, '_') + '.png';
}

// extra function for toggling needed since change of position to show
function toggleDatePickerDiv(isMobile) {
    if (!isMobile) {
        isMobile = pageIsMobileFormat();
    }

    const datePickerDiv = $('#datePickerDiv');

    // if mobile view, show date picker div on bottom
    // else on top
    datePickerDiv.css('top', isMobile ? 'auto' : '0');
    datePickerDiv.css('bottom', isMobile ? '0' : 'auto');

    // set edge boarders
    datePickerDiv.css('border-radius', isMobile ? '1rem 1rem 0 0' : '0 0 1rem 1rem');

    // toggle date picker div
    datePickerDiv.animate({height: 'toggle'}, {duration: 200});
}

function hideArticlesList() {
    // save scroll state of article list
    articlesListScrollState = $('#sidebarContent').scrollTop();

    // hide articles list div
    $('#articlesListDiv').hide();

    // animate show articles list button div
    $('#articlesButtonDiv').animate({width: 'show'});

    // show articles button
    $('#articlesListButtonBack').hide();
    $('#articlesListButtonList').show();
}

function showArticlesList() {
    // show articles list div
    $('#articlesListDiv').show();

    // re-initate with old scroll state
    $('#sidebarContent').scrollTop(articlesListScrollState);


    // animate hide articles list button div
    $('#articlesButtonDiv').animate({width: 'hide'});

    // show back button (if last selected marker is not null)
    if (lastSelectedMarker !== null) {
        $('#articlesListButtonBack').show();
    }

    $('#articlesListButtonList').hide();
}

async function openSideBar(marker) {
    // if is opened with marker
    // show articles list
    const markerMode = marker !== null;

    // specific actions only take place if sidebar is not already opened
    // get color rgb values from hex
    const rgb = markerMode ?
        hexToRgb(marker.color) : {
            r: 0, g: 0, b: 0
        };

    // sidebar and content divs
    const sidebar = $('#sidebar');
    const sidebarContent = $('#sidebarContent');

    // sidebar width is different for mobile users (or mobile format)
    const isMobile = pageIsMobileFormat();
    const sidebarWidth = isMobile ? '100%' : '42%';

    // set margin left for main element, show sidebar, set color etc.
    sidebarContent.css('background', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.19)`);

    // fetch sidebar text if not already loaded if is not in articles mode
    if (markerMode && false === marker.descriptionLoaded) {
        // load the description text
        const res = await fetch('/api/text/' + ['disaster', 'report', 'news'][marker.source] + '/' + marker.id);
        // check response is ok
        if (res.status === 200) {
            // parse the text
            const text = await res.text();
            // set to true
            marker.descriptionLoaded = true;

            // replace &quot; with " and append text
            marker.description += text.replace(/&quot;/g, '"');
        }
    }

    if (sidebarIsClosed) {
        //$('#main').css('marginLeft', sidebarWidth);
        sidebar.css('width', sidebarWidth);
        sidebar.animate({
            width: 'toggle'
        }, {
            complete: function () {
                if (markerMode) {
                    // set sidebar text
                    $('#sidebarText').html(marker.description);
                    // open links in sidebar in new tab
                    $('#sidebarText a').attr('target', '_blank');
                } else {
                    $('#sidebarText').text('');
                }
            }
        });

        if (markerMode) {
            // display article list button in marker mode
            $('#articlesListButtonList').show();
            $('#articlesListButtonBack').hide();
        } else {
            // hide articlesButtonDiv with opening of the sidebar if is articles mode
            $('#articlesButtonDiv').animate({width: 'hide'});
        }

        // toggle show settings (only on mobile sized devices)
        if (isMobile) {
            $('#settings').animate({width: 'toggle', height: 'toggle'});

            // if datepicker div is visible, close it
            if ($('#datePickerDiv').is(':visible')) {
                datePickerDivHiddenOnSidebar = true;
                $('#datePickerDiv').animate({height: 'toggle'});
            }
        }
        // if is in marker mode, show new text
    } else if (markerMode) {
        // hide articles list
        hideArticlesList();
        // set last selected marker to null to get back to articles list mode next button click
        lastSelectedMarker = null;
        // set sidebar text directly without animation
        $('#sidebarText').html(marker.description);
        // open links in sidebar in new tab
        $('#sidebarText a').attr('target', '_blank');
        // make sure is scrolled to top
        sidebarContent.scrollTop(0);
    } else {
        // set last selected marker to selected maker
        lastSelectedMarker = selectedMarker;
        // if is in articles mode, show articles list
        showArticlesList();
        // and set no text in sidebarText
        $('#sidebarText').text('');
    }

    // only if useGeoJSON is true
    // and is in marker and not article mode
    if (markerMode && useGeoJSON) {
        // on the map, mark the region as selected (get event geo json and add it to the map as layer)
        const eventGeoJSON = getGeoJSONFromEvent(sourceGeoJSON[marker.source], marker.eventIndex);

        // remove marked layer and source if they already exist (sidebar was already opened for other event)
        if (!sidebarIsClosed && map.getLayer('marked-layer')) {
            map.removeLayer('marked-layer');
            map.removeSource('marked');
        }

        // add source and layer
        map.addSource('marked', {
            'type': 'geojson', 'data': eventGeoJSON
        });

        // add a layer that marks the current selection
        map.addLayer({
            'id': 'marked-layer', 'type': 'fill', 'source': 'marked', 'layout': {}, 'paint': {
                'fill-color': ['get', 'fill'], 'fill-opacity': 0.9
            }
        });
    }

    // set boolean to indicate sidebar is open and set selected marker
    sidebarIsClosed = false;
    selectedMarker = markerMode ? marker : null;
}


// open the sidebar with list of articles
function openArticlesList() {
    // show the list of articles
    showArticlesList();

    // open sidebar with list of articles (pass null)
    openSideBar(null);
}

function closeSideBar() {
    // do nothing if sidebar is already closed
    if (sidebarIsClosed) {
        return;
    }

    // get if is mobile orientation
    const isMobile = pageIsMobileFormat();

    // hide sidebar
    $('#sidebar').animate({width: 'toggle'}, {
        complete: function () {
            // remove sidebar text on animation finish
            $('#sidebarText').html('');
        }
    });
    // toggle show settings (if on mobile view or is not showing currently)
    if (isMobile || !$('#settings').is(':visible')) {
        $('#settings').animate({width: 'toggle', height: 'toggle'});
    }

    // show article button div again
    $('#articlesButtonDiv').animate({width: 'show'});

    // show date picker div if it was hidden on sidebar open
    if (datePickerDivHiddenOnSidebar) {
        datePickerDivHiddenOnSidebar = false;
        toggleDatePickerDiv(isMobile);
    }

    // remove marked layer and source if uses geojson
    // and if the layer exists
    if (useGeoJSON && map.getLayer('marked-layer')) {
        map.removeLayer('marked-layer');
        map.removeSource('marked');
    }

    // make sure articlesList is hidden again
    $('#articlesListDiv').hide();

    // set sidebar closed and selected marker null, as well as sidebar marker
    sidebarIsClosed = true;
    lastSelectedMarker = null;
    selectedMarker = null;

    // reset articles list scroll top
    articlesListScrollState = 0;
}

function clickSettingsButton(onlyHide) {
    if (loading || (onlyHide !== null && onlyHide !== settingsOpened)) {
        return;
    }

    // animate settings button turn
    $('#settingsButton').animate({degrees: settingsOpened ? -180 : 180}, {
        duration: 180, step: function (now) {
            $(this).css({transform: 'rotate(' + now + 'deg)'});
        }, complete: function () {
            settingsOpened = !settingsOpened;
        }
    });

    // animate settings panel
    $('#settingsPanel').animate({width: 'toggle', height: 'toggle'}, {
        duration: 200,
    });

    // also toggle date panel
    toggleDatePickerDiv(null);
}

function addMarkers(map, markers, dataList, colors, source) {

    // loop through all data indexes
    for (let dataIndex = 0; dataIndex < dataList.length; dataIndex++) {
        const data = dataList[dataIndex];

        // define event name
        const eventName = [data.type, 'ReliefWeb Report', 'IPS News Article'][source];

        // get path of marker image and if black or white should be used
        const black = useBlack(colors[dataIndex]);
        const markerImagePath = getMarkerImagePath(data.type, black);

        // get publication date
        const eventDate = new Date(data.date);

        // create marker icon
        const markerIcon = document.createElement('div');
        markerIcon.title = data.title;  // title on hover
        markerIcon.style.width = '32px';
        markerIcon.style.height = '32px';
        markerIcon.style.backgroundSize = 'contain';
        markerIcon.style.cursor = 'pointer';
        markerIcon.style.backgroundColor = colors[dataIndex];
        markerIcon.style.borderRadius = '50%';
        markerIcon.style.border = '1px solid ' + colors[dataIndex];
        markerIcon.style.opacity = '0.72';
        markerIcon.style.backgroundImage = `url(${markerImagePath})`;

        // add point in right that shows how long the event lays in the past (days)
        // if activated
        const textElementDiv = document.createElement('div');
        markerIcon.appendChild(textElementDiv);
        textElementDiv.style.width = '18px';
        textElementDiv.style.height = '18px';
        textElementDiv.style.backgroundColor = 'red';
        textElementDiv.style.borderRadius = '50%';
        textElementDiv.style.backgroundSize = 'contain';
        textElementDiv.style.color = 'white';
        textElementDiv.style.opacity = '0.9';
        textElementDiv.style.border = '1px solid red';
        textElementDiv.classList.add('topRightText');
        textElementDiv.classList.add('eventDuration');
        textElementDiv.style.display = showEventDurationCookie === 'true' ? 'block' : 'none';

        const textElement = document.createElement('div');
        textElementDiv.appendChild(textElement);
        textElement.textContent = data.daysSinceEvent;
        textElement.style.fontSize = '0.8rem';
        textElement.classList.add('absoluteCenter');

        // create marker with popup
        const marker = new maplibregl.Marker(markerIcon, {
            color: colors[dataIndex], draggable: false, anchor: 'center',
        }).setLngLat([data.lon, data.lat]);

        // set description attribute to marker to be used in sidebar text (with formatted date)
        const dateString = eventDate.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
        });

        // get marker image path for sidebar
        const markerImagePathSidebar = markerImagePath.replace(/white/g, 'black');

        // set marker html text for sidebar
        marker.description = `<div><img src="${markerImagePathSidebar}" alt="event type" style="width: 2rem; height: 2rem; margin-bottom: 0.5rem"><br><i>`
            + eventName
            + '</i></div><p><small>'
            + dateString
            + '</small></p><h2><a href="'
            + data.url
            + '">'
            + data.title
            + '</a></h2><br>';

        marker.descriptionLoaded = false;


        // set marker html text for article list
        marker.articleDescription = `<div class="p-1" style="display: inline-flex"><img src="${markerImagePathSidebar}" alt="event type" style="width: 2rem; height: 2rem; float: left">`
            + `<button class="link ms-2" onclick="onArticleClick(${data.id})">`
            + data.title
            + ' <small>('
            + dateString
            + ')</small></button></div>';

        // add id of event to marker
        marker.id = data.id;

        // set color of marker to be used in sidebar text
        marker.color = colors[dataIndex];

        // set marker index for GeoJSON retrieval
        marker.eventIndex = Number(dataIndex);
        marker.source = source;

        // set coords to marker
        marker.lat = data.lat;
        marker.lon = data.lon;

        // add date info
        marker.date = eventDate;

        // add to map
        marker.addTo(map);

        // and to the list of markers
        markers.push(marker);
    }
}


function onArticleClick(markerId) {
    // get marker with id
    const marker = markers.find((marker) => marker.id === markerId);
    // open sidebar with marker
    openSideBar(marker);
}

// function for showing and hiding layers and their markers
function toggleLayer(map, markers, layerId, show) {
    // try to toggle geojson layers only if used
    if (useGeoJSON) {
        map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');
    }

    // filter show or hide markers
    const layerNames = {
        0: 'disaster-layer',
        1: 'report-layer',
        2: 'news-layer',
    };

    markers.filter(m => layerId === layerNames[m.source]).forEach(m => m.getElement().style.display = show ? 'block' : 'none');
}
