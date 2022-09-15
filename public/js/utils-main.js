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

async function buildGeoJSON(files, colors, isDisaster) {
    // the object to be returned
    let featureCollection = {
        type: 'FeatureCollection', features: []
    };

    // iterate over all files
    await Promise.all(files.map(async (geoJsonFilesList, eventIndex) => {
            // fetch geo json from provided path
            const geoJsons = await Promise.all(geoJsonFilesList.map(async (geoJsonFile) => {
                const res = await fetch(geoJsonFile);
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

    // add news and disaster layer
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
