const logger = require('../utils/logger.js');
const stationsStore = require('../models/stations-store.js');
const stationDataFormatter = require('../utils/station-data-formatter.js');
const readingsStore = require('../models/readings-store.js');
const owmApiHelper = require('../utils/owm-api-helper.js');

const stations = {
    async index(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        // get the station id from url
        const stationId = req.params.station_id;
        // get the station data from db
        const stationData = await stationsStore.getStationData(req.session.user, stationId);
        // format to view data
        const formattedStationData = stationDataFormatter.formatStationData(stationData);
        // load readings from db
        const readings = await readingsStore.getReadings(req.session.user, stationId);

        const viewData = {
            title: stationData[0].location,
            station_id: stationId,
            station_data: formattedStationData[0].data,
            readings: readings,
            no_readings: readings.length === 0 ? 'No readings yet' : ''
        };

        res.render('stations', viewData);
    },
    async deleteReading(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        // get station id form params
        const readingId = req.params.reading_id;

        // delete station
        await readingsStore.deleteReading(readingId);

        // redirect to station page again
        res.redirect('/stations/' + req.params.station_id);
    },
    async addReading(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        // get station id form params
        const stationId = req.params.station_id;

        // add reading to db
        await readingsStore.addReading(req.session.user, stationId, req.body);

        // redirect to station page again
        res.redirect('/stations/' + stationId);
    },
    async addAutoReading(req, res) {
        // if is not logged in reroute to login page
        if (!req.session.user) {
            res.redirect('/');
            return;
        }

        // get station id form params
        const stationId = req.params.station_id;

        // get lat/lng of station from id
        const stationData = await stationsStore.getStationLatLngById(stationId);
        // get data from openweathermap api
        const apiResponse = await owmApiHelper.getWeatherData(stationData.latitude, stationData.longitude);

        // add reading to db
        await readingsStore.addReading(req.session.user, stationId, apiResponse);

        // redirect to station page again
        res.redirect('/stations/' + stationId);
    }
};

module.exports = stations;