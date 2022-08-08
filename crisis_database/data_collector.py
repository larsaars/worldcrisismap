#!/usr/bin/env python3

"""
Handles the scraping of the ReliefWeb Disasters and Reports API.
"""

import requests
import psycopg2 as pg
import os
import sys

def printerr(*args, **kwargs):
    """
    Prints an error message to the console.
    """
    print(*args, file=sys.stderr, **kwargs)

# get environment variables
DB_CON_STRING = os.getenv('DB_CON_STRING', None)

# build up database connection
try:
    connection = pg.connect(DB_CON_STRING)
except Exception as e:
    printerr(e)

cur = connection.cursor(cursor_factory=pg.extras.DictCursor)

# cur.execute(QUERY)
# cur.fetchall()


def escape(string):
    """
    Escape dangerous characters for database in string.

    :param string: The string to escape.
    """
    return string.replace('\'', '&#39;').replace('"', '&quot;').replace('\\', '\\\\').replace('\n', '<br>')


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
            fd = item['fields']
            country = fd['country'][0]
            description_html = fd['profile']['description-html'] if 'description-html' in fd else '' 

            cur.execute(f"INSERT INTO disasters(id, date, status, country_name, lat, lon, type, url, title, description_html) VALUES ({item['id']}, '{fd['date']['event']}', '{fd['status']}', '{escape(country['name'])}', {country['location']['lat']}, {country['location']['lon']}, '{escape(fd['primary_type']['name'])}', '{fd['url']}', '{escape(fd['name'])}', '{description_html}');")
        except Exception as e:
            printerr(e)


    # return total number of disasters in API
    return res['totalCount']


def load_reports_to_database(limit=10) -> None:
    pass

