const express = require('express');
const router = express.Router();

const home = require('./controllers/home.js');

// public routes
router.get('/', home.index);


module.exports = router;
