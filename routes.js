const express = require('express');
const router = express.Router();

// import environment variables
const dotenv = require('dotenv');
dotenv.config();

const home = require('./controllers/home.js');
const info = require('./controllers/info.js');
const thoughts = require('./controllers/thoughts.js');


// public routes
router.get('/', home.index);
router.get('/about', info.about);
router.get('/privacy-policy', info.privacy);
router.get('/helpful-links', info.helpfulLinks);
router.get('/inequality-worldwide', info.inequalityWorldwide);

// database request routes
router.get('/api/data/disaster/:onlyNewData/:ts', home.getDisaster);
router.get('/api/data/report/:onlyNewData/:ts', home.getReport);
router.get('/api/data/news/:onlyNewData/:ts', home.getNews);
router.get('/api/data/human/:onlyNewData/:ts', home.getHuman);
router.get('/api/text/disaster/:id', home.getDisasterText);
router.get('/api/text/report/:id', home.getReportText);
router.get('/api/text/news/:id', home.getNewsText);
router.get('/api/text/human/:id', home.getHumanText);

// thoughts / easteregg
router.get('/thoughts', thoughts.index);

// robots.txt
router.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send("User-agent: *\nDisallow: /about\nDisallow: /privacy-policy\nDisallow: /helpful-links\nDisallow: /thoughts\nDisallow: /nocrisis\nDisallow: /api/*");
});

module.exports = router;
