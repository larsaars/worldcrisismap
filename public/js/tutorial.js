/*
contains all the code for the tutorial at the first time opening the website
 */

// this is true during the tutorial
// if there is a click somewhere during the tutorial, the tutorial is stopped
let isTutorial = false;

function doTutorial() {
    // tutorial started
    const tour = isTutorial = new Shepherd.Tour({
        defaultStepOptions: {
            cancelIcon: {
                enabled: true
            },
            scrollTo: {behavior: 'smooth', block: 'center'}
        }
    });

    // buttons for tour
    // normal back and next buttons
    const buttonsNormal = [
        {
            action() {
                return this.back();
            },
            classes: 'shepherd-button-secondary',
            text: 'Back'
        },
        {
            action() {
                isTutorial = false
                return this.cancel();
            },
            classes: 'shepherd-button-secondary',
            text: 'Skip tutorial'
        },
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ];

    //sources
    const buttonsSources = [
        {
            action() {
                return this.back();
            },
            classes: 'shepherd-button-secondary',
            text: 'Back'
        },
        {
            action() {
                isTutorial = false
                return this.cancel();
            },
            classes: 'shepherd-button-secondary',
            text: 'Skip tutorial'
        },
        {
            action() {
                return this.show('datepicker');
            },
            classes: 'shepherd-button-secondary',
            text: 'Skip sources'
        },
        {
            action() {
                return this.next();
            },
            text: 'Next'
        }
    ];

    // first introduction
    tour.addStep({
        title: 'Welcome!',
        text: '<b>World Crisis Map</b> is a website designed to provide real-time updates on the latest disasters and humanitarian crises worldwide.<br><br>'
            + 'By clicking on any of the interactive icons displayed on the map, you can read an article related to the selected crisis, along with a highlighted visualization of the affected region on the map.',
        buttons: [
            {
                action() {
                    isTutorial = false
                    return this.cancel();
                },
                classes: 'shepherd-button-secondary',
                text: 'Skip tutorial'
            },
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
        title: 'Articles List',
        text: 'If you want an overview of all articles shown on the map, you can click here.',
        attachTo: {
            element: '#articlesButton',
            on: 'left'
        },
        buttons: buttonsNormal,
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
                    isTutorial = false
                    return this.cancel();
                },
                classes: 'shepherd-button-secondary',
                text: 'Skip tutorial'
            },
            {
                action() {
                    // open settings
                    clickSettingsButton(null);
                    return this.next();
                },
                text: 'Next'
            }
        ],
    });

    // the sources
    // add tutorial step for each source

    // ReliefWeb Disasters
    tour.addStep({
        title: 'ReliefWeb Disasters',
        text: '&quot;ReliefWeb (RW) is a humanitarian information portal founded in 1996. '
            + 'As of July 2023, it hosts more than one million humanitarian situation reports, press releases, evaluations, guidelines, assessments, maps and infographics. '
            + 'The portal is an independent source of information, designed specifically to assist the international humanitarian community in effective delivery of emergency assistance or relief. '
            + 'It provides information as humanitarian crises unfold, while emphasizing the coverage of "forgotten emergencies" at the same time.<br>'
            + 'ReliefWeb was founded […] by the <a href="https://en.wikipedia.org/wiki/United_Nations_Office_for_the_Coordination_of_Humanitarian_Affairs">United Nations Office for the Coordination of Humanitarian Affairs (OCHA)</a>.&quot;&nbsp;'
            + '<small>(<a href="https://en.wikipedia.org/wiki/ReliefWeb" target="_blank">from Wikipedia</a>)</small><br><br>'
            + 'ReliefWeb Disasters are mainly natural disasters, epedemics, etc.',
        attachTo: {
            element: '#disasterCheckboxDiv',
            on: pageIsMobileFormat() ? 'bottom' : 'left'
        },
        buttons: buttonsSources,
    });

    // ReliefWeb Reports
    tour.addStep({
        title: 'ReliefWeb Reports',
        text: 'These are mostly humanitarian reports.',
        attachTo: {
            element: '#reportCheckboxDiv',
            on: pageIsMobileFormat() ? 'bottom':'left'
        },
        buttons: buttonsSources,
    });

    // UHRI
    tour.addStep({
        title: 'Universal Human Rights Index',
        text: 'The UHRI is part of the <a href="https://en.wikipedia.org/wiki/Office_of_the_United_Nations_High_Commissioner_for_Human_Rights">&quot;Office of the United Nations High Commissioner for Human Rights (OHCHR)</a>&quot;.<br><br>'
            + '&quot;The UHRI allows you to explore over 220.000 observations and recommendations made by the international human rights protection system.&quot;&nbsp;'
            + '<small>(<a href="https://uhri.ohchr.org/en/">from UHRI</a>)</small>',
        attachTo: {
            element: '#humanCheckboxDiv',
            on: pageIsMobileFormat() ? 'bottom' : 'left'
        },
        buttons: buttonsSources,
    });

    // IPS News
    tour.addStep({
        title: 'Inter Press Service',
        text: '&quot;Inter Press Service (IPS) is a global news agency headquartered in Rome, Italy. '
            + 'Its main focus is news and analysis about social, political, civil, and economic subjects as it relates to the Global South, civil society and globalization.&quot;&nbsp;'
            + '<small>(<a href="https://en.wikipedia.org/wiki/Inter_Press_Service" target="_blank">from Wikipedia</a>)</small>',
        attachTo: {
            element: '#newsCheckboxDiv',
            on: pageIsMobileFormat() ? 'bottom' : 'left'
        },
        buttons: buttonsNormal,
    });

    // datepicker
    tour.addStep({
        title: 'Historic Data',
        text: 'Pick a past date to browse the world map as it would have been shown on that day.',
        attachTo: {
            element: '#datePicker',
            on: pageIsMobileFormat() ? 'top' : 'bottom'
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
                    // tutorial finished
                    isTutorial = false;
                    return this.next();
                },
                text: 'Got it!'
            }
        ],
        id: 'datepicker'
    });

    tour.start();
}