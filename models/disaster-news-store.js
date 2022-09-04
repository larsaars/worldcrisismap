const dataStore = require('./data-store.js');
const logger = require('../utils/logger.js');

const disasterNewsStore = {
    async getNews(timestamp) {
        // default query and values if not given or timestamp
        let query = 'SELECT * FROM reports WHERE date > now() - INTERVAL \'3 DAY\'';
        let values = [];

        if (timestamp) {
            const date = new Date(Number(timestamp) * 1000);
            // validate time stamp
            if (date.getTime() > 0) {
                // if timestamp is below min date of 2011-04-19 02:06:21 (oldest report in database); return empty json array '[]'
                if (date.getTime() < 1303412469000) {
                    return '[]';
                    // if date is not today, change query accordingly
                } else {
                    query = 'SELECT * FROM reports WHERE date < $1 AND date > $1 - INTERVAL \'3 DAY\'';
                    values = [date];
                }
            }
        }

        // execute query and send stringified json array
        const dbRes = await dataStore.query(
            query,
            values,
            'Error while fetching news'
        );
        return JSON.stringify(dbRes.rows);
    },
    async getDisasters(timestamp) {
        // default query and values if not given or timestamp
        let query = 'SELECT * FROM disasters WHERE status IN (\'ongoing\', \'alert\')';
        let values = [];

        if (timestamp) {
            const date = new Date(Number(timestamp) * 1000);
            // validate time stamp
            if (date.getTime() > 0) {
                // if timestamp is below min date of 1981-11-26 00:00:00 (oldest disaster in database); return empty json array '[]'
                if (date.getTime() < 375577200000) {
                    return '[]';
                    // if date is not today, change query accordingly
                } else {
                    query = 'SELECT * FROM disasters WHERE date < $1 AND date > $1 - INTERVAL \'3 MONTH\'';
                    values = [date];
                }
            }
        }

        // execute query and send stringified json array
        const dbRes = await dataStore.query(
            query,
            values,
            'Error while fetching disasters'
        );
        return JSON.stringify(dbRes.rows);
    },
};

module.exports = disasterNewsStore;