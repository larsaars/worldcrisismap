#!/usr/bin/env python3
"""
Update the database every N hours.

Start with:
nohup python3 database_updater.py 1> /dev/null 2> ../logs/updater.log &

Kill with:
kill $(ps aux | grep database_updater.py | grep -v grep | awk '{print $2}')
"""

import os
from time import sleep
from data_collector import *
from dotenv import load_dotenv

# load environment variables
load_dotenv()

N_HOURS = int(os.getenv('UPDATE_DISASTERS_N_HOURS', '3'))
N_ITEMS = int(os.getenv('UPDATE_DISASTERS_N_ITEMS', '10'))



def update_database():
    # load newest update of disasters to database
    load_disasters_to_database(offset=0, limit=N_ITEMS, single_commits=True)

    # load today's reports to database
    load_reports_to_database(offset=0, limit=N_ITEMS, single_commits=True)

    # load news to database
    load_news_to_database()

    # update ongoing disasters
    update_ongoing_disasters_in_database()


if __name__ == '__main__':
    while True:
        # update then sleep for N_HOURS
        update_database()
        sleep(N_HOURS * 3600)
    

