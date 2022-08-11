#!/usr/bin/env bash

###############################################################################
#                        UPDATE THE SERVER                                    #
###############################################################################


# update repo
git pull

# packages
sudo apt update
sudo apt upgrade -y

# install dependencies for python as well as for nodejs
npm install
pip install -r ./crisis_database/requirements.txt

