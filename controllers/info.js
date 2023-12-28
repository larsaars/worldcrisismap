
const info = {
    async inequalityWorldwide(request, response) {
        const viewData = {
            title: 'Inequality Graphs',
            id: 'inequality-worldwide',
            layout: 'info'
        };

        response.render('inequality-worldwide', viewData);
    },
    async helpfulLinks(request, response) {
        const viewData = {
            title: 'Helpful Links',
            id: 'helpful-links',
            layout: 'info'
        };

        response.render('helpful-links', viewData);
    },
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
    }
}

module.exports = info;