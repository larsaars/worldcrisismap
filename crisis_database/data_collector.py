#!/usr/bin/env python3

"""
Handles the scraping of the ReliefWeb Disasters and Reports API (as well as IPS news).
"""

import requests
import psycopg2 as pg
import os
import json
from utils import *
from content_escaper import escape_content
from dotenv import load_dotenv
import feedparser
from uhri_database_loader import load_uhri_to_database

# load environment variables
load_dotenv()

# get environment variables
DB_CON_STRING = os.getenv('DB_CON_STRING', None)

# build up database connection
try:
    connection = pg.connect(DB_CON_STRING)
except Exception as e:
    printerr(e)

cur = connection.cursor()


# load country region mapper
mappers = load_country_region_mapper_and_country_code_mapper()


def load_uhri_to_database0():
    """
    wrap load_uhri_to_database() in a function to be able to use it in the main function
    """

    load_uhri_to_database(connection, cur)


def load_disasters_to_database(offset=0, limit=10, single_commits=False) -> int:
    """
    Loads the disasters to the database.

    :param offset: The offset to start at.
    :param limit: The limit of the number of disasters to load.

    :return: The total number of disasters in API.
    """
    # get disasters from ReliefWeb API
    res = requests.get(f'https://api.reliefweb.int/v1/disasters?appname=crisis_collector&profile=full&preset=latest&slim=1&limit={limit}&offset={offset}')

    # check if response is empty
    if not res.text:
        print('No response from ReliefWeb API')
        return 5
    else:
        res = res.json()

    # loop through each disaster and add to database
    for item in res['data']:
        try:
            # the fields object
            fd = item['fields']
            
            # generate geojson
            # get all involved countries (alpha3 codes)
            countries = [country['iso3'] for country in fd['country']]

            # get description in plain text, if not available
            description = fd['description'] if 'description' in fd else fd['name']

            # search for matching geojson files and lat / lon
            geojson_object, lat, lon, _ = search_matching_geojson_files_or_coords(description, countries, mappers, False)

            # if lat == None, use fallback (primary country lat / lon)
            if  lat == None:
                lat = float(fd['primary_country']['location']['lat'])
                lon = float(fd['primary_country']['location']['lon'])

            # convert geojson_object to json
            geojson = json.dumps(geojson_object)

            # load description_html if available
            description_html = escape_content(fd['description-html'], 'ReliefWeb', fd['url']) if 'description-html' in fd else '' 

            # execute insert query for info
            query = f"INSERT INTO disasters(id, date, status, country_name, geojson, lat, lon, type, url, title) VALUES ({item['id']}, '{fd['date']['event']}', '{fd['status']}', '{escape(fd['primary_country']['name'])}', '{geojson}', {lat}, {lon}, '{escape(fd['primary_type']['name'])}', '{fd['url']}', '{escape(fd['name'])}');"
            cur.execute(query)
            # insert insert query for description
            query = f"INSERT INTO disasters_text(id, text) VALUES ({item['id']}, '{description_html}');"
            cur.execute(query)


            # if single_commits, commit changes after every insert
            if single_commits:
                connection.commit()
        except Exception as e:
            connection.rollback()
            printerr(type(e), e)

    

    # commit changes
    if not single_commits:
        print('Committing changes to database...')
        connection.commit()

    # return total number of disasters in API
    return res['totalCount']


def update_ongoing_disasters_in_database():
    """
    Updates the ongoing disasters in the database.
    """

    # get ongoing (and alert) disasters from ReliefWeb API
    res = requests.get('https://api.reliefweb.int/v1/disasters?appname=crisis_collector&profile=full&preset=latest&slim=1&filter[field]=status&filter[value][]=alert&filter[value][]=ongoing&filter[operator]=OR&limit=999')
    # check if response is empty
    if not res.text:
        print('No response from ReliefWeb API')
        return 5
    else:
        res = res.json()

    # get list of currently as active listed disasters in database
    cur.execute('SELECT id FROM disasters WHERE status IN (\'ongoing\', \'alert\');')
    database_ongoing_disasters = [item[0] for item in cur.fetchall()]

    # get list of ongoing disasters in API
    api_ongoing_disasters = [item['id'] for item in res['data']]

    # get list of ongoing disasters that are not in API
    old_ongoing_disasters = [item for item in database_ongoing_disasters if item not in api_ongoing_disasters]

    # update old ongoing disasters to be inactive
    for item in old_ongoing_disasters:
        cur.execute(f'UPDATE disasters SET status = \'past\' WHERE id = {item};')


    # update text of ongoing disasters the api provided in database
    # as well as status to ongoing
    for item in res['data']:
        try: 
            # the fields object
            fd = item['fields']

            # load description_html if available
            description_html = escape_content(fd['description-html'], 'ReliefWeb', fd['url']) if 'description-html' in fd else '' 

            # execute update query for description
            query = f"UPDATE disasters_text SET text = '{description_html}' WHERE id = {item['id']};"
            cur.execute(query)

            # execute update query for status
            query = f"UPDATE disasters SET status = 'ongoing' WHERE id = {item['id']};"
            cur.execute(query)

            # commit changes after every insert
            connection.commit()
        except Exception as e:
            connection.rollback()
            printerr(type(e), e)


        


def load_reports_to_database(offset=0, limit=10, single_commits=False) -> int:
    """
    Loads the reports (headlines) to the database.

    :param offset: The offset to start at.
    :param limit: The limit of the number of disasters to load.

    :return: The total number of reports (headlines) in API.
    """
    # get disasters from ReliefWeb API
    res = requests.get(f'https://api.reliefweb.int/v1/reports?appname=crisis_collector&profile=full&preset=latest&slim=1&filter[field]=headline&offset={offset}&limit={limit}')
    # check if response is empty
    if not res.text:
        print('No response from ReliefWeb API')
        return 5
    else:
        res = res.json()

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
            countries = [country['iso3'] for country in fd['country']]

            # get description in plain text, if not available
            description = fd['body'] if 'body' in fd else fd['title']

            # search for matching geojson files and lat / lon
            geojson_object, lat, lon, _ = search_matching_geojson_files_or_coords(description, countries, mappers, False)

            # if lat == None, use fallback (primary country lat / lon)
            if  lat == None:
                lat = float(fd['primary_country']['location']['lat'])
                lon = float(fd['primary_country']['location']['lon'])

            # convert geojson_object to json
            geojson = json.dumps(geojson_object)

            # get type of report
            report_type = infer_type_by_title(fd['title'])

            # load description_html if available
            description_html = escape_content(fd['body-html'], 'ReliefWeb', fd['url']) if 'body-html' in fd else '' 

            # execute insert query for info
            query = f"INSERT INTO reports(id, date, country_name, geojson, lat, lon, type, url, title) VALUES ({item['id']}, '{fd['date']['changed']}', '{escape(fd['primary_country']['name'])}', '{geojson}', {lat}, {lon}, '{report_type}', '{fd['url']}', '{escape(fd['title'])}');"
            cur.execute(query)
            # insert insert query for description
            query = f"INSERT INTO reports_text(id, text) VALUES ({item['id']}, '{description_html}');"
            cur.execute(query)

            # if single_commits, commit changes after every insert
            if single_commits:
                connection.commit()
        except Exception as e:
            connection.rollback()
            printerr(type(e), e)

    

    # commit changes
    if not single_commits:
        print('Committing changes to database...')
        connection.commit()


    # return total number of disasters in API
    return res['totalCount']


def load_news_to_database() -> int:
    """
    Loads the daily IPS RSS news feed to the database.
    Truncate the old table.

    :return: The total number of news items in API.
    """


    # load feed via feedparser lib
    feed = feedparser.parse('https://www.ipsnews.net/news/headlines/feed/')

    # clear table for today
    cur.execute('TRUNCATE TABLE news_today;')
    cur.execute('TRUNCATE TABLE news_today_text;')
    connection.commit()

    # create id counter
    identifier = 0
    
    # loop through each entry
    for entry in feed.entries:
        try:
            # increase id
            identifier += 1

            # get entry html content
            content = entry.content[0].value
            
            # generate geojson
            geojson_object, lat, lon, last_max_country = search_matching_geojson_files_or_coords(content, None, mappers, True)

            # if everything returned is None, skip
            if lat == None and lon == None and geojson_object == None:
                continue

            # if has not found a country, continue
            if last_max_country is None:
                continue

            # get type from title
            news_type = infer_type_by_title(entry.title)
            link = escape(entry.link)


            # convert geojson_object to json
            geojson = json.dumps(geojson_object)

            # execute insert query for info
            query = f"INSERT INTO news_today(id, date, country_name, geojson, lat, lon, type, url, title) VALUES ({identifier}, '{entry.published}', '{escape(last_max_country)}', '{geojson}', {lat}, {lon}, '{news_type}', '{link}', '{escape(entry.title)}');"
            cur.execute(query)
            # insert insert query for description
            escaped_content = escape_content(entry.summary, 'IPS News', link)
            query = f"INSERT INTO news_today_text(id, text) VALUES ({identifier}, '{escaped_content}');"
            cur.execute(query)

            # direcly commit insert
            connection.commit()
        except Exception as e:
            connection.rollback()
            printerr(type(e), e)

