const logger = require('../utils/logger.js');

const home = {
    index(request, response) {
        const viewData = {
            title: 'Weathertop'
        };

        response.render(request.session.user ? 'index-logged-in' : 'index-logged-out' , viewData);
    },
};

module.exports = home;
