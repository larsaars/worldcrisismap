const easteregg = {
    async index(request, response) {
        const viewData = {
            title: 'Yes',
            id: 'easteregg',
            layout: 'info'
        };


        response.render('easteregg', viewData);
    }
}

module.exports = easteregg;
