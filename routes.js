const express = require('express');
const router = express.Router();

const home = require('./controllers/home.js');
const info = require('./controllers/info.js');

// public routes
router.get('/', home.index);
router.get('/about', info.about);
router.get('/privacy-policy', info.privacy);

// database request routes
router.get('/api/disaster/:ts', home.getDisaster);
router.get('/api/report/:ts', home.getReport);
router.get('/api/news/:ts', home.getNews);

module.exports = router;
