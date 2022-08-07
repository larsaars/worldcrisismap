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

N_HOURS = int(os.getenv('N_HOURS', '6'))




def update_database():
    pass


if __name__ == '__main__':
    while True:
        # update then sleep for N_HOURS
        update_database()
        sleep(N_HOURS * 3600)
    

