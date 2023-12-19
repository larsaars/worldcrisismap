/*
contains all the code for the tutorial at the first time opening the website
 */

function doTutorial() {
    const tour = new Shepherd.Tour({
        defaultStepOptions: {
            cancelIcon: {
                enabled: true
            },
            scrollTo: {behavior: 'smooth', block: 'center'}
        }
    });

    // first introduction
    tour.addStep({
        title: 'Welcome!',
        text: 'World Crisis Map is a website that shows you the latest disasters and (humanitarian) crises around the world.\n'
            + 'Click on one of the icons on the map and you will see its article as well as the region it affects highlighted on the map.',
        buttons: [
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ],
    });

    // articles list
    tour.addStep({
        title: 'Articles list',
        text: 'If you want an overview of all articles shown on the map, you can click here.',
        attachTo: {
            element: '#articlesButton',
            on: 'left'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ],
    });

    // settings and sources
    tour.addStep({
        title: 'Settings',
        text: 'For selecting sources shown on the map and more, click here.',
        attachTo: {
            element: '#settingsButton',
            on: 'bottom'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    clickSettingsButton(null);
                    return this.next();
                },
                text: 'Next'
            }
        ],
    });

    // the sources
    // start with ReliefWeb Disasters
    tour.addStep({
        title: 'Sources',
        text: 'Here you can select the sources you want to see on the map.\n'
            + 'You can also select the color of the markers for each source.',
        attachTo: {
            element: '#disasterCheckbox',
            on: 'left'
        },
        buttons: [
            {
                action() {
                    return this.back();
                },
                classes: 'shepherd-button-secondary',
                text: 'Back'
            },
            {
                action() {
                    // TODO
                },
                text: 'Skip sources'
            },
            {
                action() {
                    return this.next();
                },
                text: 'Next'
            }
        ],
    });

    // datepicker

    // tour.addStep({
    //     title: 'Welcome to World Crisis Map!',
    //     text: 'bla bla',
    //     attachTo: {
    //         element: '#settingsButton',
    //         on: 'bottom'
    //     },
    //     buttons: [
    //         {
    //             action() {
    //                 clickSettingsButton(null)
    //                 return this.back();
    //             },
    //             classes: 'shepherd-button-secondary',
    //             text: 'Back'
    //         },
    //         {
    //             action() {
    //                 return this.next();
    //             },
    //             text: 'Next'
    //         }
    //     ],
    //     id: 'creating'
    // });

    tour.start();
}