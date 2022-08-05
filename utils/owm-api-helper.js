const logger = require('./logger.js');
const fetch = require('node-fetch');
const apiKey = process.env.OWM_API_KEY;

const owmApiHelper = {
    async getWeatherData(lat, lon) {
        // make http request to openweathermap api
        const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const json = await response.json();

        logger.info(`Got weather data from openweathermap api for lat: ${lat} and lon: ${lon}`);

        // return data in correct format
        return {
            temperature: json.main.temp,
            air_pressure: json.main.pressure,
            wind_speed: json.wind.speed,
            wind_direction: json.wind.deg,
            weather: json.weather[0].id
        };
    }
};

module.exports = owmApiHelper;