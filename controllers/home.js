const disasterNewsStore = require('../models/disaster-news-store.js');

const home = {
    async index(request, response) {
        const viewData = {
            title: 'World Crisis Map',
            disasterData: await disasterNewsStore.getDisasters(),
            newsData: await disasterNewsStore.getNews()
        };

        response.render('index' , viewData);
    },
    async about(request, response) {
        const viewData = {
            title: 'About World Crisis Map',
        };

        response.render('about' , viewData);
    }
};

module.exports = home;
