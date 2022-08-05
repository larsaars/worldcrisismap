const readingsStore = require('../models/readings-store');

const weatherUtilityFunctions = {
    windDirectionFromDegree(degree) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        // degree is in range [0, 360]
        const index = Math.floor(Math.abs((degree + 11.25) % 360) / 22.5);
        return directions[index];
    },
    weatherCodeToDescription(code) {
        if (code >= 200 && code <= 232) {
            return 'Thunderstorm';
        } else if (code >= 300 && code <= 321) {
            return 'Drizzle';
        } else if (code >= 500 && code <= 531) {
            return 'Rain';
        } else if (code >= 600 && code <= 622) {
            return 'Snow';
        } else if (code >= 701 && code <= 781) {
            return 'Atmosphere';
        } else if (code === 800) {
            return 'Clear';
        } else if (code >= 801 && code <= 804) {
            return 'Clouds';
        } else if (code === readingsStore.dummyWeatherCode) {
            return 'N/A';
        } else {
            return code;
        }
    },
    weatherCodeToIcon(code) {
        if (code >= 200 && code <= 232) {
            return 'fa-bolt';
        } else if (code >= 300 && code <= 321) {
            return 'fa-cloud-rain';
        } else if (code >= 500 && code <= 531) {
            return 'fa-cloud-showers-heavy';
        } else if (code >= 600 && code <= 622) {
            return 'fa-snowflake';
        } else if (code >= 701 && code <= 781) {
            return 'fa-smog';
        } else if (code === 800) {
            return 'fa-sun';
        } else if (code >= 801 && code <= 804) {
            return 'fa-cloud';
        } else {
            return 'fa-question';
        }
    },
    trendToIcon(trend) {
        switch (trend) {
            case -1:
                return 'fa-arrow-alt-circle-up';
            case 0:
                return 'fa-arrow-alt-circle-right';
            case 1:
                return 'fa-arrow-alt-circle-down';
            default:
                return '';
        }
    }
};

module.exports = weatherUtilityFunctions;
