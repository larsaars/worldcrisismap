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


def main():
    jumpsize = 100  # scraping jumpsize

    # confirm to execute
    confirm = input('This will delete all data in the database and reload. Are you sure? (y/n) ')

    if confirm != 'y':
        print('Aborting.')
        return


    # init sql file 
    cur.execute('''-- clear complete database
    DROP TABLE disasters, reports_today;

    -- create tables

    CREATE TABLE IF NOT EXISTS disasters(
        id INTEGER PRIMARY KEY,
        date TIMESTAMP,
        status VARCHAR(7),
        country_name VARCHAR(50),
        lat DECIMAL(10, 7),
        lon DECIMAL(10, 7),
        type VARCHAR(200),
        url VARCHAR(100),
        title VARCHAR(250),
        description_html VARCHAR(100000)
    );


    CREATE TABLE IF NOT EXISTS reports_today(
        id INTEGER PRIMARY KEY,
        date TIMESTAMP,
        status VARCHAR(7)
    );
    ''')

    # begin looping through the disasters API
    current_offset, total_count = 0, 1

    while current_offset < total_count:
        print(f'current offset: {current_offset}')

        total_count = load_disasters_to_database(offset=current_offset, limit=jumpsize)
        current_offset += jumpsize


    # continue loading todays reports




if __name__ == '__main__':
    main()


