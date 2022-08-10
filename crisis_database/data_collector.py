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



def load_disasters_to_database(offset=0, limit=10) -> int:
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

            # for fallback (if function finds nothing, coords of first country are put in the geojson field)
            coords = [float(fd['primary_country']['location']['lat']), float(fd['primary_country']['location']['lon'])]

            # get description in plain text, if not available
            description = fd['description'] if 'description' in fd else fd['name']

            # finally generate
            geojson = json.dumps(search_matching_geojson_files_or_coords(description, countries, coords, contry_region_mapper))

            # load description_html if available
            description_html = escape(fd['description-html']) if 'description-html' in fd else '' 

            # execute insert query
            cur.execute(f"INSERT INTO disasters(id, date, status, country_name, geojson, type, url, title, description_html) VALUES ({item['id']}, '{fd['date']['event']}', '{fd['status']}', '{escape(fd['primary_country']['name'])}', '{geojson}', '{escape(fd['primary_type']['name'])}', '{fd['url']}', '{escape(fd['name'])}', '{description_html}');")
        except Exception as e:
            printerr(type(e), e)

    

    # commit changes
    print('Committing changes to database...')
    connection.commit()


    # return total number of disasters in API
    return res['totalCount']


def load_reports_to_database(offset=0, limit=10) -> int:
    pass

