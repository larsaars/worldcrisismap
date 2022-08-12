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


// listen on port 3000 (in env variables)
app.listen(process.env.PORT, () => {
    console.log(`CrisisMap listening on ${process.env.PORT}`);
});

module.exports = app;
