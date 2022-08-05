const dataStore = require('./data-store');
const logger = require('../utils/logger');
const readingsStore = require('./readings-store');

const stationsStore = {
    async getStationData(email, stationId = null) {
        // query all stations belonging to current user
        // with most current readings
        // evaluates to for example to:
        //time	location	latitude	longitude	weather	temperature	wind_speed	wind_direction air_pressure
        // 2020-01-01 00:00:00	Berlin	52.5200000	13.4050000	0	0	0	0    0
        // 2020-01-01 00:00:03	Hamburg	52.5200000	13.4050000	0	7	0	0    0

        // query from all stations belonging to current user
        // the max and min values for parameters
        // temperature, wind speed, air pressure
        // evaluates to for example to :
        //station_id	min_temp	max_temp	min_wind	max_wind	min_pressure	max_pressure
        // 1	0	0	0	0	0	0
        // 2	0	7	0	0	0	0

        // join the two queries above
        // resulting in for example :
        //time	location	latitude	longitude	weather	temperature	wind_speed	wind_direction	air_pressure	min_temp	max_temp	min_wind	max_wind	min_pressure	max_pressure
        // 2020-01-01 00:00:00	Berlin	52.5200000	13.4050000	0	0	0	0	0	0	0	0	0	0	0
        // 2020-01-01 00:00:03	Hamburg	52.5200000	13.4050000	0	7	0	0	0	0	7	0	0	0	0

        // if stationId is not null, only return the station with the given id
        // (augment the query above with the station_id)

        // finds only stations with readings, so when creating a new station
        // always add a dummy reading

        const stationQueryPart = stationId ? 'and s.id=$2\n' : '\n';
        const stationsWithMaxMinValuesAndLatestReadings = await dataStore.query(
            'select \n' +
            's.id as station_id, r.time, s.location, s.latitude, s.longitude, r.weather, r.temperature, r.wind_speed, r.wind_direction, r.air_pressure,\n' +
            'sc.min_temp, sc.max_temp, sc.min_wind, sc.max_wind, sc.min_pressure, sc.max_pressure\n' +
            'from stations as s\n' +
            'join readings as r on s.id = r.station_id\n' +
            '-- join with query of min/max values\n' +
            'join\n' +
            '(select sr.station_id,\n' +
            'min(sr.temperature) as min_temp, max(sr.temperature) as max_temp,\n' +
            'min(sr.wind_speed) as min_wind, max(sr.wind_speed) as max_wind,\n' +
            'min(sr.air_pressure) as min_pressure, max(sr.air_pressure) as max_pressure\n' +
            'from stations as ss\n' +
            'join readings as sr on ss.id = sr.station_id\n' +
            'where ss.email=$1\n' +
            'group by sr.station_id) as sc\n' +
            'on sc.station_id = r.station_id\n' +
            '-- end of join\n' +
            'where s.email=$1\n' +
            stationQueryPart +
            'and r.time=\n' +
            '(select max(time)\n' +
            'from readings r2\n' +
            'where r.station_id=r2.station_id)',
            stationId ? [email, stationId] : [email],
            'error fetching all stations and its data'
        );

        let  stationData = stationsWithMaxMinValuesAndLatestReadings.rows;

        // add trend data to stations
        // for this use multiple queries
        for (let station of stationData) {
            // get trends for this specific station
            const trends = await this.getStationTrends(email, station.station_id);

            if (trends !== undefined) {
                // add to object
                station.temperature_trend = trends.temperature_trend;
                station.wind_trend = trends.wind_trend;
                station.pressure_trend = trends.pressure_trend;
            }
        }

        return stationData;
    },
    async getStationTrends(email, stationId) {
        // return
        // trends for temperature, air pressure and wind
        // with -1, 0, 1 for different trends
        const stationTrends = await dataStore.query(
            'select\n' +
            'sign(t1 - t2) as temperature_trend,\n' +
            'sign(a1 - a2) as pressure_trend,\n' +
            'sign(w1 - w2) as wind_trend\n' +
            'from\n' +
            '-- subquery with first and second row in one\n' +
            '(select \n' +
            'row1.email as email,\n' +
            'row1.temperature as t1, \n' +
            'row1.air_pressure as a1, \n' +
            'row1.wind_speed as w1,\n' +
            'row2.temperature as t2,\n' +
            'row2.air_pressure as a2,\n' +
            'row2.wind_speed as w2\n' +
            'from readings row1\n' +
            '-- join subquery (second row) to first row\n' +
            'join\n' +
            '(select station_id, temperature, air_pressure, wind_speed\n' +
            'from readings\n' +
            'where station_id=$2\n' +
            'order by time desc\n' +
            'limit 1 offset 1) as row2\n' +
            'on row1.station_id = row2.station_id\n' +
            '-- end of join\n' +
            'where row1.station_id=$2\n' +
            'order by time desc\n' +
            'limit 1) as sub\n' +
            'where email=$1',
            [email, stationId],
            'error fetching station trends'
        );

        return stationTrends.rows[0];
    },
    async createStation(email, station) {
        // returns true if everything went well
        try {
            // create station
            const stationId = await dataStore.query(
                'insert into stations (email, location, latitude, longitude) values ($1, $2, $3, $4) returning id',
                [email, station.location, Number(station.latitude), Number(station.longitude)],
                'error creating station'
            );
            // create dummy reading with id 1
            return await readingsStore.addDummyReading(email, stationId.rows[0].id);
        } catch (e) {
            return false;
        }
    },
    async deleteStation(stationId) {
        await dataStore.query(
            'delete from stations where id=$1',
            [stationId],
            'error deleting station'
        );
    },
    async getStationLatLngById(stationId) {
        const station = await dataStore.query(
            'select latitude, longitude from stations where id=$1',
            [stationId],
            'error fetching station lat/lng'
        );
        return station.rows[0];
    }
};

module.exports = stationsStore;