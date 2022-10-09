// global bool if sidebar is open
let sidebarIsClosed = true, selectedMarker = null;
// global variable for settings
let settingsOpened = false;
// global variable if is loading
let loading = true;
// global variable if datepicker div has been animated, if so, show it again on sidebar close
let datePickerDivHiddenOnSidebar = false;


// detect if page is in mobile format or mobile phone
// call every time newly because window can be resized
function pageIsMobileFormat() {
    return ($(window).innerHeight() / $(window).innerWidth()) >= 1.4;
}

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

function openSideBar(map, marker, allGeoJson) {
    // specific actions only take place if sidebar is not already opened
    // get color rgb values from hex
    const rgb = hexToRgb(marker.color);

    // sidebar and content divs
    const sidebar = $('#sidebar');
    const sidebarContent = $('#sidebarContent');

    // sidebar width is different for mobile users (or mobile format)
    const isMobile = pageIsMobileFormat();
    const sidebarWidth = isMobile ? '100%' : '42%';

    // set margin left for main element, show sidebar, set color etc.
    sidebarContent.css('background', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.19)`);

    if (sidebarIsClosed) {
        //$('#main').css('marginLeft', sidebarWidth);
        sidebar.css('width', sidebarWidth);
        sidebar.animate({
            width: 'toggle'
        }, {
            complete: function () {
                // set sidebar text
                $('#sidebarText').html(marker.description);
                // open links in sidebar in new tab
                $('#sidebarText a').attr('target', '_blank');
            }
        });
        // toggle show settings (only on mobile sized devices)
        if (isMobile) {
            $('#settings').animate({width: 'toggle', height: 'toggle'});

            // if datepicker div is visible, close it
            if ($('#datePickerDiv').is(':visible')) {
                datePickerDivHiddenOnSidebar = true;
                $('#datePickerDiv').animate({height: 'toggle'});
            }
        }
    } else {
        // set sidebar text directly without animation
        $('#sidebarText').html(marker.description);
        // open links in sidebar in new tab
        $('#sidebarText a').attr('target', '_blank');
    }

    // on the map, mark the region as selected (get event geo json and add it to the map as layer)
    const eventGeoJSON = getGeoJSONFromEvent(allGeoJson, marker.eventIndex);

    // remove marked layer and source if they already exist (sidebar was already opened for other event)
    if (!sidebarIsClosed) {
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

    // set boolean to indicate sidebar is open and set selected marker
    sidebarIsClosed = false;
    selectedMarker = marker;
}

function closeSideBar() {
    // do nothing if sidebar is already closed
    if (sidebarIsClosed) {
        return;
    }

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

    // show date picker div if it was hidden on sidebar open
    if (datePickerDivHiddenOnSidebar) {
        datePickerDivHiddenOnSidebar = false;
        toggleDatePickerDiv(isMobile);
    }

    // remove marked layer and source
    map.removeLayer('marked-layer');
    map.removeSource('marked');
    // set sidebar closed and selected marker null
    sidebarIsClosed = true;
    selectedMarker = null;
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

    for (const dataIndex in dataList) {
        const data = dataList[dataIndex];
        // define event name
        const eventName = [data.type, 'ReliefWeb Report', 'IPS News Article'][source];

        // get path of marker image and if black or white should be used
        const black = useBlack(colors[dataIndex]);
        const markerImagePath = getMarkerImagePath(source === 0 ? data.type : 'report', black);

        // get publication date
        const eventDate = new Date(data.date);

        // create marker icon
        const markerIcon = document.createElement('div');
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
        const daysSinceEvent = String(Math.floor((date - eventDate) / 86400000));

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
        textElement.textContent = daysSinceEvent;
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

// function for showing and hiding layers and their markers
function toggleLayer(map, markers, layerId, show) {
    map.setLayoutProperty(layerId, 'visibility', show ? 'visible' : 'none');
    const layerNames = {
        0: 'disaster-layer',
        1: 'report-layer',
        2: 'news-layer',
    };
    markers.filter(m => layerId === layerNames[m.source]).forEach(m => m.getElement().style.display = show ? 'block' : 'none');
}
