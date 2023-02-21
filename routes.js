const express = require('express');
const router = express.Router();

// import environment variables
const dotenv = require('dotenv');
dotenv.config();

const home = require('./controllers/home.js');
const info = require('./controllers/info.js');
const easteregg = require('./controllers/easteregg.js');


// public routes
router.get('/', home.index);
router.get('/about', info.about);
router.get('/privacy-policy', info.privacy);

// database request routes
router.get('/api/data/disaster/:onlyNewData/:ts', home.getDisaster);
router.get('/api/data/report/:onlyNewData/:ts', home.getReport);
router.get('/api/data/news/:onlyNewData/:ts', home.getNews);
router.get('/api/text/disaster/:id', home.getDisasterText);
router.get('/api/text/report/:id', home.getReportText);
router.get('/api/text/news/:id', home.getNewsText);

// easteregg
router.get('/nocrisis', easteregg.index);

// robots.txt
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /about\nDisallow: /privacy-policy");
});

module.exports = router;
