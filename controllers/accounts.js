const userStore = require('../models/user-store.js');
const logger = require('../utils/logger.js');

const accounts = {
    logout(request, response) {
        request.session.destroy();
        response.redirect('/');
    },

    signup(request, response) {
        // if is logged in, reroute to dashboard
        if (request.session.user) {
            response.redirect('/dashboard');
        } else {
            response.render('signup', {title: 'Signup'});
        }
    },

    async register(request, response) {
        // the body content of the request is the user data
        // directly add to database
        // add user to database, if it doesn't work, return to signup page

        // user won't be added if:
        // - email is already taken
        // - email does not contain @
        // - password is less than 6 characters
        // - names are not provided

        const result = await userStore.addUser(request.body);
        response.redirect(result ? '/' : '/signup');
    },

    async authenticate(request, response) {
        // returns undefined if user is not found
        const email = await userStore.authenticateUser(request.body.email, request.body.password);

        logger.info(`authenticate: ${email}`);

        // if user is found, set session
        if (email)
            request.session.user = email;


        response.redirect(email ? '/dashboard' : '/');
    },
};

module.exports = accounts;