#!/usr/bin/env python3

"""
Loads UHRI data to database from online json database.
"""

import json
import ijson
from urllib.request import urlopen
from tqdm import tqdm


def load_uhri_to_database(connection, cur, uhri_country_mapping=None, show_progress=False):
    """
    Main function to load UHRI data to database.
    Resets whole dataset and reloads it (since it either ways has to iterate over the whole > 200MB json file).

    :param connection: psycopg2 connection object
    :param cur: psycopg2 cursor object
    """

    def prog(iterable):
        if show_progress:
            return tqdm(iterable)
        else:
            return iterable

    # load country mapping
    if uhri_country_mapping is None:
        try:
            with open('./mappers/uhri_country_mapping.json', 'r') as f:
                uhri_country_mapping = json.load(f)
        except Exception as e:
            print(e)
            return False

    # truncate tables (to be completely reloaded)
    try:
        cur.execute('''TRUNCATE TABLE human;
TRUNCATE TABLE human_text;''')
        connection.commit()
    except Exception as e:
        connection.rollback()
        print(e)
        return False

    
    # load data from online json database
    # open file stream
    file = urlopen('https://dataex.ohchr.org/uhri/export-results/export-full-en.json')
    # load json objects (only observations)
    objects = ijson.items(file, 'item')
    observations = (o for o in objects if o['AnnotationType'] == '- Concerns/Observations')

    # dictionary for storing the countries involved
    # and the date of each document describing violations
    doc_data = {} 

    # iterate over observations (document parts)
    for o in prog(observations):
        doc_id = o['DocumentId']
        doc = doc_data.get(doc_id)

        # if document is not yet in dictionary, add it
        if doc == None:
            doc_data[doc_id] = doc = {
                'date': o['PublicationDateOnUhri'],
                'countries': set(o['Countries']),
            }

            db_cmd = 'INSERT INTO human_text(id, text) VALUES (%(id)s, %(text)s);'
        else:
            # else append the text
            db_cmd = 'UPDATE human_text SET text = CONCAT(text, %(text)s) WHERE id = %(id)s;'

        try:
            cur.execute(db_cmd, {
                            'id': doc_id, 
                            'text': o['Text'] + '<br>'
                        })
            connection.commit()
        except:
            connection.rollback()

        # update countries involved set
        doc['countries'].update(o['Countries'])

    # loop through each single document id
    for doc_id in prog(doc_data):
        # these information are needed (and loaded into database 'human')
        # - date
        # - country name
        # - geojson paths (from country iso3s)
        # - lat / lon
        # - title
        # - text

        countries = list(doc_data[doc_id]['countries'])

        # if there are no country names involved, skip entry
        if len(countries) == 0:
            continue

        # the first country name is used as title
        country_name = countries[0]
        geojson = json.dumps(['countries/' + uhri_country_mapping[country]['iso3'] + '.json' for country in countries])  # geojson paths
        lat, lon = uhri_country_mapping[country_name]['lat'], uhri_country_mapping[country_name]['lon']
        title = 'Human Right Violations in ' + country_name

        # load data into database
        try:
            cur.execute('''
    INSERT INTO human(id, date, country_name, geojson, lat, lon, title)
    VALUES (%(id)s, %(date)s, %(country_name)s, %(geojson)s, %(lat)s, %(lon)s, %(title)s);
            ''', {
                'id': doc_id,
                'date': doc_data[doc_id]['date'],
                'country_name': country_name,
                'geojson': geojson,
                'lat': lat,
                'lon': lon,
                'title': title
            })

            connection.commit()
        except:
            connection.rollback()

    return True
    


if __name__ == '__main__':
    # if is called directly, connect to database and run main
    from dotenv import load_dotenv
    import psycopg2 as pg
    import os


    # load environment variables 
    load_dotenv()

    # get environment variables
    DB_CON_STRING = os.getenv('DB_CON_STRING', None)

    # build up database connection
    try:
        connection = pg.connect(DB_CON_STRING)
    except Exception as e:
        print(e)

    cur = connection.cursor()

    # run main
    load_uhri_to_database(connection, cur, show_progress=True)
