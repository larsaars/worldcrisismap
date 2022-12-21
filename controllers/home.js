const disasterNewsStore = require('../models/disaster-news-store.js');

// GET /api/:what/:onlyNewData/:ts
async function getDataFromSource(func, request, response) {
    const ts = Number(request.params.ts);
    const onlyNewData = request.params.onlyNewData === 'new';
    const data = await func(ts === 0 ? false : ts, onlyNewData);
    response.setHeader('Content-Type', 'application/json');
    response.send(data);
}

// GET /api/text/:what/:id
async function getTextFromSource(func, request, response) {
    const id = request.params.id;
    const data = await func(id);
    response.setHeader('Content-Type', 'text/plain');
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
        await getDataFromSource(disasterNewsStore.getDisaster, request, response);
    },
    async getReport(request, response) {
        await getDataFromSource(disasterNewsStore.getReport, request, response);
    },
    async getNews(request, response) {
        await getDataFromSource(disasterNewsStore.getNews, request, response);
    },
    async getDisasterText(request, response) {
        await getTextFromSource(disasterNewsStore.getDisasterText, request, response);
    },
    async getReportText(request, response) {
        await getTextFromSource(disasterNewsStore.getReportText, request, response);
    },
    async getNewsText(request, response) {
        await getTextFromSource(disasterNewsStore.getNewsText, request, response);
    }
};

module.exports = home;
