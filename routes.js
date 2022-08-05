const express = require('express');
const router = express.Router();

const home = require('./controllers/home.js');
const dashboard = require('./controllers/dashboard.js');
const stations = require('./controllers/stations.js');
const accounts = require('./controllers/accounts.js');

// public routes
router.get('/', home.index);
router.get("/signup", accounts.signup);
router.get("/logout", accounts.logout);
router.post("/register", accounts.register);
router.post("/authenticate", accounts.authenticate);

// protected routes
router.get('/dashboard', dashboard.index);
router.get('/stations/:station_id', stations.index);
router.get('/delete-station/:station_id', dashboard.deleteStation);
router.get('/delete-reading/:station_id/:reading_id', stations.deleteReading);
router.post('/add-reading/:station_id', stations.addReading);
router.get('/add-automatic-reading/:station_id', stations.addAutoReading);
router.post('/add-station', dashboard.addStation);


module.exports = router;
