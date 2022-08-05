const dataStore = require('./data-store.js');
const logger = require('../utils/logger.js');

const userStore = {
    async addUser(user) {
        logger.info(`addUser: ${user.email}`);

        try {
            await dataStore.query(
                'INSERT INTO users (email, password, first_name, last_name) VALUES($1, $2, $3, $4)',
                [user.email, user.password, user.first_name, user.last_name],
                'Error registering user',
                true
            );

            return true
        } catch (e) {
            return false;
        }
    },
    async authenticateUser(email, password) {
        const dbRes = await dataStore.query(
            'SELECT * FROM users WHERE email=$1 AND password=$2',
            [email, password],
            'error finding user from email and password',
        );

        return dbRes.rows !== undefined && dbRes.rows.length > 0 ? email : undefined;
    },
};

module.exports = userStore;