#!/usr/bin/env python3

"""
Handles the scraping of the ReliefWeb Disasters and Reports API.
"""

import requests
import psycopg2 as pg
import os
import json
from utils import *


# get environment variables
DB_CON_STRING = os.getenv('DB_CON_STRING', None)

# build up database connection
try:
    connection = pg.connect(DB_CON_STRING)
except Exception as e:
    printerr(e)

cur = connection.cursor()

# cur.execute(QUERY)
# cur.fetchall()


# load country region mapper
contry_region_mapper = load_country_region_mapper()



def load_disasters_to_database(offset=0, limit=10, single_commits=False) -> int:
    """
    Loads the disasters to the database.

    :param offset: The offset to start at.
    :param limit: The limit of the number of disasters to load.

    :return: The total number of disasters in API.
    """
    # get disasters from ReliefWeb API
    res = requests.get(f'https://api.reliefweb.int/v1/disasters?appname=crisis_collector&profile=full&preset=latest&slim=1&limit={limit}&offset={offset}').json()

    # loop through each disaster and add to database
    for item in res['data']:
        try:
            # the fields object
            fd = item['fields']
            
            # generate geojson
            # get all involved countries (alpha3 codes)
            countries = []
            for country in fd['country']:
                countries.append(country['iso3'])

            # get description in plain text, if not available
            description = fd['description'] if 'description' in fd else fd['name']

            # search for matching geojson files and lat / lon
            geojson_object, lat, lon = search_matching_geojson_files_or_coords(description, countries, contry_region_mapper)

            # if lat == None, use fallback (primary country lat / lon)
            if  lat == None:
                lat = float(fd['primary_country']['location']['lat'])
                lon = float(fd['primary_country']['location']['lon'])

            # convert geojson_object to json
            geojson = json.dumps(geojson_object)

            # load description_html if available
            description_html = escape(fd['description-html']) if 'description-html' in fd else '' 

            # execute insert query
            cur.execute(f"INSERT INTO disasters(id, date, status, country_name, geojson, lat, lon, type, url, title, description_html) VALUES ({item['id']}, '{fd['date']['event']}', '{fd['status']}', '{escape(fd['primary_country']['name'])}', '{geojson}', {lat}, {lon}, '{escape(fd['primary_type']['name'])}', '{fd['url']}', '{escape(fd['name'])}', '{description_html}');")

            # if single_commits, commit changes after every insert
            if single_commits:
                connection.commit()
        except Exception as e:
            printerr(type(e), e)

    

    # commit changes
    if not single_commits:
        print('Committing changes to database...')
        connection.commit()


    # return total number of disasters in API
    return res['totalCount']


def load_reports_to_database(offset=0, limit=10, single_commits=False) -> int:
    """
    Loads the reports (headlines) to the database.

    :param offset: The offset to start at.
    :param limit: The limit of the number of disasters to load.

    :return: The total number of reports (headlines) in API.
    """
    # get disasters from ReliefWeb API
    res = requests.get(f'https://api.reliefweb.int/v1/reports?appname=crisis_collector&profile=full&preset=latest&slim=1&filter[field]=headline&offset={offset}&limit={limit}').json()

    # loop through each disaster and add to database
    for item in res['data']:
        try:
            # the fields object
            fd = item['fields']

            # if primary_country is world, skip
            if fd['primary_country']['iso3'] == 'wld':
                continue
            
            # generate geojson
            # get all involved countries (alpha3 codes)
            countries = []
            for country in fd['country']:
                countries.append(country['iso3'])

            # get description in plain text, if not available
            description = fd['body'] if 'body' in fd else fd['title']

            # search for matching geojson files and lat / lon
            geojson_object, lat, lon = search_matching_geojson_files_or_coords(description, countries, contry_region_mapper)

            # if lat == None, use fallback (primary country lat / lon)
            if  lat == None:
                lat = float(fd['primary_country']['location']['lat'])
                lon = float(fd['primary_country']['location']['lon'])

            # convert geojson_object to json
            geojson = json.dumps(geojson_object)

            # load description_html if available
            description_html = escape(fd['body-html']) if 'body-html' in fd else '' 

            # execute insert query
            cur.execute(f"INSERT INTO reports(id, date, country_name, geojson, lat, lon, url, title, description_html) VALUES ({item['id']}, '{fd['date']['changed']}', '{escape(fd['primary_country']['name'])}', '{geojson}', {lat}, {lon}, '{fd['url']}', '{escape(fd['title'])}', '{description_html}');")

            # if single_commits, commit changes after every insert
            if single_commits:
                connection.commit()
        except Exception as e:
            printerr(type(e), e)

    

    # commit changes
    if not single_commits:
        print('Committing changes to database...')
        connection.commit()


    # return total number of disasters in API
    return res['totalCount']
