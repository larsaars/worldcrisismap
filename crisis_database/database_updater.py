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
OHCHR_N_TIMES_WAIT = int(os.getenv('UPDATE_OHCHR_N_WAIT', '8'))  # this number is multiplied by the N_HOURS variable and determines how often the OHCHR reports will be updated (so in this case every 1 1/2 days)
N_ITEMS = int(os.getenv('UPDATE_DISASTERS_N_ITEMS', '10'))  # how many items should be taken from the api each (how many new items could be expected to be new max)



def update_database():
    """
    Method to update the database (except the OHCHR/human part)
    """


    # load newest update of disasters to database
    load_disasters_to_database(offset=0, limit=N_ITEMS, single_commits=True)

    # load today's reports to database
    load_reports_to_database(offset=0, limit=N_ITEMS, single_commits=True)

    # load news to database
    load_news_to_database()

    # update ongoing disasters (remove what is not active anymore actually of disasters in the database)
    update_ongoing_disasters_in_database()



if __name__ == '__main__':
    # The count variable is used to only update the humanitarian OHCHR
    # reports not every N hours as the others, as they don't need
    # updates this often.
    count = 0

    while True:
        # update count
        count += 1
        
        # update first part of database
        update_database()

        # if count is >= OHCHR_N_TIMES_WAIT update the human tables
        if count >= OHCHR_N_TIMES_WAIT:
            load_human_to_database()

        # sleep for N_HOURS
        sleep(N_HOURS * 3600)
    

