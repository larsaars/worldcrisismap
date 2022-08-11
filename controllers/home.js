
const home = {
    index(request, response) {
        const viewData = {
            title: 'World Crisis Map',
        };

        response.render('index' , viewData);
    },
};

module.exports = home;
