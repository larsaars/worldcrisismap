const disasterNewsStore = require('../models/disaster-news-store.js');

const home = {
    async index(request, response) {
        const viewData = {
            title: 'World Crisis Map',
            id: 'main',
            disasterData: await disasterNewsStore.getDisasters(request.query.ts),
            newsData: await disasterNewsStore.getNews(request.query.ts),
            layout: 'main'
        };

        console.log('main page: ' + request.connection.remoteAddress);

        response.render('index', viewData);
    },
    async about(request, response) {
        const viewData = {
            title: 'About',
            id: 'about',
            layout: 'info'
        };

        response.render('about', viewData);
    }
};

module.exports = home;
