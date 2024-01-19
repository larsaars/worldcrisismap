const thoughts = {
    async index(request, response) {
        const viewData = {
            title: 'think about it?',
            id: 'thoughts',
            layout: 'info'
        };


        response.render('thoughts', viewData);
    }
};

module.exports = thoughts;
