const express = require('express');
const router = express.Router();

const home = require('./controllers/home.js');

// public routes
router.get('/', home.index);
router.get('/about', home.about);

// database request routes
router.get('/api/disaster/:ts', home.getDisaster);
router.get('/api/report/:ts', home.getReport);
router.get('/api/news/:ts', home.getNews);

module.exports = router;
