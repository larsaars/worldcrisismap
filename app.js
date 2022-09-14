#!/usr/bin/env node

const express = require('express');
const logger = require('./utils/logger');
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');

// import environment variables
const dotenv = require('dotenv');
dotenv.config();

// app server
const app = express();

// define using session cookies
app.use(session({
    secret: '5119497770',  // some random string
    resave: false,
    saveUninitialized: false,
}));

// enable for forms reading
app.use(bodyParser.urlencoded({extended: true}));
// use folder public as static folder for assets
app.use(express.static('public'));
app.use(express.static('crisis_database'));

// define handlebars as the view engine
app.engine('.hbs', handlebars.engine({extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('views', './views');

// define where the routes are
const routes = require('./routes');
app.use('/', routes);

// define 404 not found
app.use(function (req, res, next) {
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        const viewData = {
            title: '404 Not Found',
            id: '404',
            layout: 'info'
        };
        res.render('404', viewData);
    } else

        // respond with json
    if (req.accepts('json')) {
        res.json({error: 'Not found'});
    } else

        // default to plain-text. send()
    {
        res.type('txt').send('Not found');
    }
});


// listen on port 3000 (in env variables)
app.listen(process.env.PORT, () => {
    console.log(`CrisisMap listening on ${process.env.PORT}`);
});

module.exports = app;
