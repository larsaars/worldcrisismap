#!/usr/bin/env python3

"""
Creates init_tables.sql (postgressql) file from scraping
the ReliefWeb Disasters and Reports API.

Meant to init the database, the server will then proceed to update the
database every N hours.


The reason to do this is, that it is unpracital (for both us and ReliefWeb)
to use the API every time the timeline is used.
"""

import requests
import os

from data_collector import *
from utils import *


def main():
    jumpsize = 80 # scraping jumpsize

    # confirm to execute
    confirm = input('This will delete all data in the database and reload. Are you sure? (y/n) ')

    if confirm != 'y':
        print('Aborting.')
        return


    # init sql file (create tables)
    cur.execute('''-- clear complete database
    DROP TABLE IF EXISTS disasters;
    DROP TABLE IF EXISTS reports;


    CREATE TABLE IF NOT EXISTS disasters(
        id INTEGER PRIMARY KEY,
        date TIMESTAMP,
        status VARCHAR(7),
        country_name VARCHAR(150),
        geojson VARCHAR(8000),
        lat DECIMAL(10,7) CHECK (lat >= -90 AND lat <= 90),
        lon DECIMAL(10,7) CHECK (lon >= -180 AND lon <= 180),
        type VARCHAR(200),
        url VARCHAR(100),
        title VARCHAR(500),
        description_html VARCHAR(100000)
    );


    CREATE TABLE IF NOT EXISTS reports(
        id INTEGER PRIMARY KEY,
        date TIMESTAMP,
        country_name VARCHAR(150),
        geojson VARCHAR(8000),
        lat DECIMAL(10,7) CHECK (lat >= -90 AND lat <= 90),
        lon DECIMAL(10,7) CHECK (lon >= -180 AND lon <= 180),
        url VARCHAR(250),
        title VARCHAR(500),
        description_html VARCHAR(100000)
    );
    ''')

    connection.commit()

    # begin looping through the disasters API
    current_offset, total_count = 0, 1

    print('Loading disasters to database...')

    while current_offset < total_count:
        print(f'current offset: {current_offset}')

        total_count = load_disasters_to_database(offset=current_offset, limit=jumpsize)
        current_offset += jumpsize


    # continue loading reports (headlines)
    current_offset, total_count = 0, 1

    print('Loading reports to database...')

    while current_offset < total_count:
        print(f'current offset: {current_offset}')

        total_count = load_reports_to_database(offset=current_offset, limit=jumpsize)
        current_offset += jumpsize




if __name__ == '__main__':
    main()


