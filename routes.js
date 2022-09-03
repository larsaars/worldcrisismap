const express = require('express');
const router = express.Router();

const home = require('./controllers/home.js');

// public routes
router.get('/', home.index);
router.get('/about', home.about);


module.exports = router;
