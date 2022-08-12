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
};

module.exports = home;
