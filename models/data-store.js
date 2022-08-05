let pg = require('pg');
const logger = require('../utils/logger');
const conString = process.env.DB_CON_STRING;

const dbConfig = {
    connectionString: conString,
    ssl: {rejectUnauthorized: false}
};

if (conString === undefined) {
    logger.error('DB_CON_STRING is not defined in .env file');
    process.exit(1);
}

let dbClient = null;

const dataStore = {
    getDataStore() {
        if (dbClient === null) {
            dbClient = new pg.Client(dbConfig);
            dbClient.connect(
                err => {
                    if (err) {
                        logger.error('failed connecting to database', err);
                        process.exit(1);
                    } else {
                        logger.info('Connected to database');
                    }
                }
            );
        }
        return dbClient;
    },
    async endConnection() {
        if (dbClient !== null) {
            await dbClient.end();
        }
    },
    async query(sql, values = [], errorMessage = 'Error executing SQL query', throwError = false) {
        try {
            // call getDataStore to ensure dbClient is initialized
            this.getDataStore();
            // returns a promise
            return await dbClient.query(sql, values);
        } catch (e) {
            logger.error(errorMessage, e);

            if (throwError)
                throw e;
        }
    }
};

const email = 'lars.lars.specht@gmail.com'
const stationId = '1'
const reading = {
    weather: 0,
    temperature: 0,
    air_pressure: 0,
    wind_speed: 0,
    wind_direction: 0
}

module.exports = dataStore;