const dataStore = require('./data-store');
const logger = require('../utils/logger');

const readingsStore = {
    dummyWeatherCode: -199,
    async getReadings(email, stationId) {
        // dummy reading has every field filled to zero
        // This is needed for the station query to work
        const readings = await dataStore.query(
            'select id, email, time, weather, temperature, wind_speed, air_pressure\n' +
            'from readings\n' +
            'where email=$1\n' +
            'and station_id=$2\n' +
            'and weather <> -199\n' +
            'order by time desc',
            [email, stationId],
            'error getting readings'
        );

        return readings.rows;
    },
    async addReading(email, stationId, reading) {
        // return true if reading could be added without hurting the parameters
        try {
            await dataStore.query(
                'insert into readings(time, station_id, email, weather, temperature, air_pressure, wind_speed, wind_direction)\n' +
                'values (current_timestamp, $1, $2, $3, $4, $5, $6, $7)',
                [stationId, email, Number(reading.weather), Number(reading.temperature), Number(reading.air_pressure), Number(reading.wind_speed), Number(reading.wind_direction)],
                'error adding reading',
                true
            );

            return true;
        } catch (e) {
            return false;
        }
    },
    async addDummyReading(email, stationId) {
        // dummy reading always has id 1
        // and is needed in order for the station query to work
        return await this.addReading(email, stationId, {
            weather: -199,
            temperature: 0,
            air_pressure: 0,
            wind_speed: 0,
            wind_direction: 0
        });
    },
    async deleteReading(readingId) {
        await dataStore.query(
            'delete from readings where id=$1',
            [readingId],
            'error deleting reading'
        );
    }
};

module.exports = readingsStore;