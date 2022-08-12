const dataStore = require('./data-store.js');
const logger = require('../utils/logger.js');

const disasterNewsStore = {
    async getNews() {
        const dbRes = await dataStore.query(
            'SELECT * FROM reports WHERE date > now() - INTERVAL \'5 DAY\'',
            [],
            'getNews() failed'
        );
        return JSON.stringify(dbRes.rows);
    },
    async getDisasters() {
        const dbRes = await dataStore.query(
            'SELECT * FROM disasters WHERE status IN (\'ongoing\', \'alert\')',
            [],
            'getDisasters() failed'
        );
        return JSON.stringify(dbRes.rows);
    },
};

module.exports = disasterNewsStore;