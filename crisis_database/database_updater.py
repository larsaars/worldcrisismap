#!/usr/bin/env python3
"""
Update the database every N hours.

Use pm2 to keep running.
"""

import os
from time import sleep
from data_collector import *
from dotenv import load_dotenv

# load environment variables
load_dotenv()

N_HOURS = int(os.getenv('UPDATE_DISASTERS_N_HOURS', '6'))  # how often to update the database
N_ITEMS = int(os.getenv('UPDATE_DISASTERS_N_ITEMS', '10'))  # how many items should be taken from the api each (how many new items could be expected to be new max)
UPDATE_UHRI_N = int(os.getenv('UPDATE_UHRI_NTH_TIME', '6'))  # every which update step should the uhri database be updated (every 6th time) (so every 6*N_HOURS hours)

update_uhri_n_counter = 0  # counter to keep track of when to update uhri database


def update_database():
    """
    Method to update the database (except the OHCHR/human part)
    """

    global N_ITEMS, UPDATE_UHRI_N, update_uhri_n_counter


    # load newest update of disasters to database
    load_disasters_to_database(offset=0, limit=N_ITEMS, single_commits=True)

    # load today's reports to database
    load_reports_to_database(offset=0, limit=N_ITEMS, single_commits=True)

    # load news to database
    load_news_to_database()

    # update ongoing disasters (remove what is not active anymore actually of disasters in the database)
    update_ongoing_disasters_in_database()

    # update urhi database (human rights violations), but only every nth time
    if update_uhri_n_counter >= UPDATE_UHRI_N:
        load_uhri_to_database0()
        update_uhri_n_counter = 0
    else:
        update_uhri_n_counter += 1  # increment counter




if __name__ == '__main__':
    while True:
        # update first part of database
        update_database()


        # sleep for N_HOURS
        sleep(N_HOURS * 3600)
    

