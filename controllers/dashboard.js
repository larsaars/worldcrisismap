const logger = require('../utils/logger.js');
const stationsStore = require('../models/stations-store.js');
const stationDataFormatter = require('../utils/station-data-formatter.js');
const readingsStore = require('../models/readings-store');

const dashboard = {
    async index(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        const viewData = {
            title: 'Dashboard',
            stations: stationDataFormatter.formatStationData(
                await stationsStore.getStationData(req.session.user),
            )
        };

        res.render('dashboard', viewData);
    },
    async deleteStation(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        // get station id form params
        const stationId = req.params.station_id;

        // delete station
        await stationsStore.deleteStation(stationId);

        // redirect to dashboard again
        res.redirect('/dashboard');
    },
    async addStation(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        // add reading to db
        await stationsStore.createStation(req.session.user, req.body);

        // redirect to dashboard again
        res.redirect('/dashboard');
    }
};

module.exports = dashboard;