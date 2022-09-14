#!/usr/bin/env bash

###############################################################################
#                        UPDATE THE SERVER                                    #
###############################################################################


# update repo
git pull

# system packages
sudo apt update
sudo apt upgrade -y

# install pm2
sudo npm install -g pm2

# install dependencies for python as well as for nodejs
npm install
pip install -r ./crisis_database/requirements.txt

