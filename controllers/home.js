const disasterNewsStore = require('../models/disaster-news-store.js');

async function getFromSource(func, request, response) {
    let ts = Number(request.params.ts);
    const data = await func(ts === 0 ? false : ts);
    response.setHeader('Content-Type', 'application/json');
    response.send(data);
}

const home = {
    async index(request, response) {
        const viewData = {
            title: 'World Crisis Map',
            id: 'main',
            layout: 'main'
        };

        console.log('connection at ' + new Date().toISOString());

        response.render('index', viewData);
    },

    async getDisaster(request, response) {
        await getFromSource(disasterNewsStore.getDisaster, request, response);
    },
    async getReport(request, response) {
        await getFromSource(disasterNewsStore.getReport, request, response);
    },
    async getNews(request, response) {
        await getFromSource(disasterNewsStore.getNews, request, response);
    }
};

module.exports = home;
