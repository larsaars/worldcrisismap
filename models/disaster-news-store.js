const dataStore = require('./data-store.js');
const logger = require('../utils/logger.js');

let NEW_DATA_THRESHOLD = '4'; // days

const disasterNewsStore = {
    async getNews(timestamp, onlyNewData) {
        // if no timestamp is provided, return no data
        // since there is no IPS news archive
        if (timestamp) {
            return [];
        }

        const dbRes = await dataStore.query(
            'SELECT * FROM news_today' + (onlyNewData ? ' WHERE date > now() - INTERVAL \'' + NEW_DATA_THRESHOLD + ' DAY \'' : ''),
            [],
            'error fetching news'
        );

        return dbRes?.rows ?? [];
    },
    async getReport(timestamp, onlyNewData) {
        // default query and values if not given or timestamp
        let query = 'SELECT * FROM reports WHERE date > now() - INTERVAL \'' + (onlyNewData ? NEW_DATA_THRESHOLD : '14') +' DAY\'';
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
                    query = 'SELECT * FROM reports WHERE date < $1 AND date > $1 - INTERVAL \'' + (onlyNewData ? NEW_DATA_THRESHOLD : '14') + ' DAY\'';
                    values = [date];
                }
            }
        }

        // execute query and send json array
        const dbRes = await dataStore.query(
            query,
            values,
            'Error while fetching reports'
        );
        return dbRes?.rows ?? [];
    },
    async getDisaster(timestamp, onlyNewData) {
        // default query and values if not given or timestamp
        let query = 'SELECT * FROM disasters WHERE status IN (\'ongoing\', \'alert\')' + (onlyNewData ? ' AND date > now() - INTERVAL \'' + NEW_DATA_THRESHOLD +' DAY\'' : '');
        let values = [];

        if (timestamp) {
            const date = new Date(Number(timestamp) * 1000);
            // validate time stamp
            if (date.getTime() > 0) {
                // if timestamp is below min date of 1981-11-26 00:00:00 (the oldest disaster in database); return empty json array '[]'
                if (date.getTime() < 375577200000) {
                    return '[]';
                    // if date is not today, change query accordingly
                } else {
                    query = 'SELECT * FROM disasters WHERE date < $1 AND date > $1 - INTERVAL \'' + (onlyNewData ? NEW_DATA_THRESHOLD + ' DAY\'': '3 MONTH\'');
                    values = [date]
                }
            }
        }

        // execute query and send json array
        const dbRes = await dataStore.query(
            query,
            values,
            'Error while fetching disasters'
        );
        return dbRes.rows;
    },
    async getNewsText(id) {
        const dbRes = await dataStore.query(
            'SELECT text FROM news_today_text WHERE id = $1',
            [id],
            'Error while fetching news text'
        );
        return dbRes?.rows[0]?.text ?? '';
    },
    async getReportText(id) {
        const dbRes = await dataStore.query(
            'SELECT text FROM reports_text WHERE id = $1',
            [id],
            'Error while fetching report text'
        );
        return dbRes?.rows[0]?.text ?? '';
    },
    async getDisasterText(id) {
        const dbRes = await dataStore.query(
            'SELECT text FROM disasters_text WHERE id = $1',
            [id],
            'Error while fetching disaster text'
        );
        return dbRes?.rows[0]?.text ?? '';
    }
};

module.exports = disasterNewsStore;