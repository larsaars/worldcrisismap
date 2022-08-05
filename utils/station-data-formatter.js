const logger = require('../utils/logger');
const weatherHelper = require('./weather-utility-functions');
const readingsStore = require('../models/readings-store');

const stationDataFormatter = {
    formatStationData(stationData) {
        // format station data into format that can be used in the view
        // scheme we want :
        // title:
        //stations: [
        //  {
        //        station_id: '1',
        //        data: [
        //            {
        //                name: 'Munich',
        //                text: 'station 1'
        //                icon: '...'
        //                icon_color: '...'
        //                trend_icon: '...'
        //            }
        //            ...
        //            {
        //                name: 'Weather',
        //                text: '800'
        //                icon: '...'
        //                icon_color: '...'
        //                trend_icon: '...'
        //            },
        //        ],
        //    },
        //    ...
        //]

        // scheme we have :
        //[
        //   {
        //     station_id: 1,
        //     time: 2019-12-31T23:00:00.000Z,
        //     location: 'Berlin',
        //     latitude: '52.5200000',
        //     longitude: '13.4050000',
        //     weather: 0,
        //     temperature: 0,
        //     wind_speed: 0,
        //     wind_direction: 0,
        //     air_pressure: 0,
        //     min_temp: 0,
        //     max_temp: 0,
        //     min_wind: 0,
        //     max_wind: 0,
        //     min_pressure: 0,
        //     max_pressure: 0
        //     temperature_trend: 1
        //     wind_trend: 0
        //     pressure_trend: 0
        //   }
        // ]

        let stations = [];

        for (const station of stationData) {
            // if weather code is -199, then we don't have weather data for this station
            // return information accordingly
            const isEmptyWeather = station.weather === -199;

            stations.push({
                    station_id: station.station_id,
                    data: [
                        {
                            name: station.location,
                            text: `Lat: ${station.latitude}<br>Lon: ${station.longitude}`,
                            icon: '',
                            icon_color: 'grey',
                            trend_icon: ''
                        },
                        {
                            name: 'Weather',
                            text: weatherHelper.weatherCodeToDescription(station.weather),
                            icon: weatherHelper.weatherCodeToIcon(station.weather),
                            icon_color: 'grey',
                            trend_icon: ''
                        },
                        {
                            name: 'Temperature',
                            text: isEmptyWeather ? 'N/A' : `${station.temperature} °C<br>Min: ${station.min_temp}<br>Max: ${station.max_temp}`,
                            icon: 'fa-thermometer-half',
                            icon_color: 'silver',
                            trend_icon: weatherHelper.trendToIcon(station.temperature_trend)
                        },
                        {
                            name: 'Wind',
                            text: isEmptyWeather ? 'N/A' : `${station.wind_speed} bft<br>${weatherHelper.windDirectionFromDegree(station.wind_direction)}<br>Min: ${station.min_wind}<br>Max: ${station.max_wind}`,
                            icon: 'fa-wind',
                            icon_color: 'teal',
                            trend_icon: weatherHelper.trendToIcon(station.wind_trend)
                        },
                        {
                            name: 'Air Pressure',
                            text: isEmptyWeather ? 'N/A' : `${station.air_pressure} hPa<br>Min: ${station.min_pressure}<br>Max: ${station.max_pressure}`,
                            icon: 'fa-tachometer-alt',
                            icon_color: 'olive',
                            trend_icon: weatherHelper.trendToIcon(station.pressure_trend)
                        }
                    ]
                }
            );
        }

        return stations;
    }
};

module.exports = stationDataFormatter;