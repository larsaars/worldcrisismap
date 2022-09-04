const disasterNewsStore = require('../models/disaster-news-store.js');

const home = {
    async index(request, response) {
        const viewData = {
            title: 'World Crisis Map',
            disasterData: await disasterNewsStore.getDisasters(request.query.ts),
            newsData: await disasterNewsStore.getNews(request.query.ts),
            layout: 'main'
        };

        response.render('index', viewData);
    },
    async about(request, response) {
        const viewData = {
            title: 'About',
            layout: 'info'
        };

        response.render('about', viewData);
    }
};

module.exports = home;
