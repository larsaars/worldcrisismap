
const info = {
    async about(request, response) {
        const viewData = {
            title: 'About',
            id: 'about',
            layout: 'info'
        };

        response.render('about', viewData);
    },
    privacy(request, response) {
        const viewData = {
            title: 'Privacy Policy',
            id: 'privacy',
            layout: 'info'
        };

        response.render('privacy-policy', viewData);
    },
}

module.exports = info;