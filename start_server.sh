#!/usr/bin/env bash

###############################################################################
#                        START THE SERVER                                     #
###############################################################################

# load environment variables from .env file
set -a
source .env
set +a

# update the server
git pull
sudo apt update
sudo apt upgrade -y

# install needed packages
sudo apt install python3-pip python3 nodejs -y

# install dependencies for python as well as for nodejs
npm install
pip install -r ./crisis_database/requirements.txt

# start the database updater
nohup python3 ./crisis_database/database_updater.py 1> /dev/null 2> ./logs/updater.log &

# start the server
nohup nodejs main.js &
