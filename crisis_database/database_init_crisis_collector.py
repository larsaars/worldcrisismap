#!/usr/bin/env python3

"""
Initializes the datbase from scraping the ReliefWeb Disasters and Reports API
as well as loading the IPS news to database (from their RSS feed)
and OHCHR's humanitarian crises.

Meant to init the database, the server will then proceed to update the
database every N hours.

The reason to do this is (caching basically everything of the ReliefWeb API etc.), 
that it is unpracital (for both us and ReliefWeb)
to use the foreign API every time the timeline is used.
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
    DROP TABLE IF EXISTS news_today;
    DROP TABLE IF EXISTS disasters_text;
    DROP TABLE IF EXISTS reports_text;
    DROP TABLE IF EXISTS news_today_text;
    DROP TABLE IF EXISTS human;
    DROP TABLE IF EXISTS human_text;


    --- disasters table (ReliefWeb Disasters)
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
        title VARCHAR(500)
    );

    CREATE TABLE IF NOT EXISTS disasters_text( id INTEGER PRIMARY KEY,
        text VARCHAR(100000)
    );


    --- reports table (ReliefWeb Reports)
    CREATE TABLE IF NOT EXISTS reports(
        id INTEGER PRIMARY KEY,
        date TIMESTAMP,
        country_name VARCHAR(150),
        geojson VARCHAR(8000),
        lat DECIMAL(10,7) CHECK (lat >= -90 AND lat <= 90),
        lon DECIMAL(10,7) CHECK (lon >= -180 AND lon <= 180),
        type VARCHAR(200),
        url VARCHAR(250),
        title VARCHAR(500)
    );

    CREATE TABLE IF NOT EXISTS reports_text(
        id INTEGER PRIMARY KEY,
        text VARCHAR(100000)
    );
    

    --- news table (IPS News)
    CREATE TABLE IF NOT EXISTS news_today(
        id INTEGER PRIMARY KEY,
        date TIMESTAMP,
        country_name VARCHAR(150),
        geojson VARCHAR(8000),
        lat DECIMAL(10,7) CHECK (lat >= -90 AND lat <= 90),
        lon DECIMAL(10,7) CHECK (lon >= -180 AND lon <= 180),
        type VARCHAR(200),
        url VARCHAR(500),
        title VARCHAR(500)
    );

    CREATE TABLE IF NOT EXISTS news_today_text(
        id INTEGER PRIMARY KEY,
        text VARCHAR(100000)
    );


    --- human table (UHRI humanitarian violations (document-wise))
    CREATE TABLE IF NOT EXISTS human(
        id SERIAL PRIMARY KEY,
        date TIMESTAMP,
        country_name VARCHAR(150),
        geojson VARCHAR(8000),
        lat DECIMAL(10,7) CHECK (lat >= -90 AND lat <= 90),
        lon DECIMAL(10,7) CHECK (lon >= -180 AND lon <= 180),
        title VARCHAR(500)
    );

    CREATE TABLE IF NOT EXISTS human_text(
        id INTEGER PRIMARY KEY,
        text VARCHAR(100000)
    );
    ''')

    connection.commit()

    # begin looping through the ReliefWeb disasters API
    current_offset, total_count = 0, 1

    print('\n\nLoading ReliefWeb disasters to database...')

    while current_offset < total_count:
        print(f'current offset: {current_offset}')

        total_count = load_disasters_to_database(offset=current_offset, limit=jumpsize)
        current_offset += jumpsize


    # continue loading ReliefWeb reports (headlines)
    current_offset, total_count = 0, 1

    print('\n\nLoading ReliefWeb reports to database...')

    while current_offset < total_count:
        print(f'current offset: {current_offset}')

        total_count = load_reports_to_database(offset=current_offset, limit=jumpsize)
        current_offset += jumpsize


    # load IPS news headlines to database
    print('\n\nLoading IPS news headlines to database...')
    load_news_to_database()

    # load humanitarian crisis into database
    print('\n\nLoading humanitarian crises of OHCHR to database...')
    load_human_to_database()
    

    print('Done.')




if __name__ == '__main__':
    main()


