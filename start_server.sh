#!/usr/bin/env bash

###############################################################################
#                        START THE SERVER                                     #
###############################################################################

# load environment variables from .env file
export $(grep -v '^#' .env | xargs)

# start the database updater
nohup python3 ./crisis_database/database_updater.py 1> /dev/null 2> ./logs/updater.log &

# start the server
nohup node app.js &
