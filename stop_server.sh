#!/usr/bin/env bash

###############################################################################
#                        STOP THE SERVER                                      #
###############################################################################

# stop processes
kill $(ps aux | grep database_updater.py | grep -v grep | awk '{print $2}')
kill $(ps aux | grep main.js | grep -v grep | awk '{print $2}')
