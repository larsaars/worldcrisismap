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
from html import escape


# delete old file
os.system('rm ./init_tables.sql')


# PARAMS
jumpsize = 100  # scraping jumpsize


# open sql file in append mode
file = open('./init_tables.sql', 'a')

# init sql file 
file.write('''-- clear complete database
DROP TABLE disasters;

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
    overview_html VARCHAR(100000)
);


CREATE TABLE IF NOT EXISTS reports_today(
    id INTEGER PRIMARY KEY,
    date TIMESTAMP,
    status VARCHAR(7)
)

-- insert values into tables
''')

# begin looping through the disasters API
current_offset, total_count = 0, 1

while current_offset < total_count:
    print(f'current offset: {current_offset}')

    res = requests.get(f'https://api.reliefweb.int/v1/disasters?appname=crisis_collector&profile=full&preset=latest&slim=1&limit={jumpsize}&offset={current_offset}').json()

    appendage = []  # what will be appended to file (insert into)


    for item in res['data']:
        try:
            fd = item['fields']
            country = fd['country'][0]
            overview_html = escape(fd['profile']['overview-html']) if 'profile' in fd else '' 

            appendage.append(f"INSERT INTO disasters(id, date, status, country_name, lat, lon, type, url, title, overview_html) VALUES ({item['id']}, '{fd['date']['event']}', '{fd['status']}', '{escape(country['name'])}', {country['location']['lat']}, {country['location']['lon']}, '{fd['type'][0]['name']}', '{fd['url']}', '{escape(fd['name'])}', '{overview_html}');")
        except Exception as e:
            print(e)


    # write to file, join list with two extra lines
    file.write('\n'.join(appendage))


    # recalculate offset etc
    current_offset += jumpsize
    total_count = res['totalCount']



# write file
file.close()
