# World Crisis Map

Website displaying humanitarian crisis and news using [OpenStreetMap](https://openstreetmap.org) and [ReliefWeb](https://reliefweb.int).

## setup server (ubuntu)

- setup https / apache2
- install `postgresql` and init
    - login to psql promt (`sudo -u postgres psql`)
    - set new password (`\password`)
    - create database (`CREATE DATABASE crisismap;`)
- setup your `.env` file (have a look at the example `.env_example` file)
- install Python 3 and NodeJS (`sudo apt install python3-pip python3 nodejs`)
- setup database with script `database_init_crisis_collector.py`
- install packages and updates by running `./update_server.sh`
- start server by running `./start_server.sh`
- stop server by running `./stop_server.sh`
- have a look at [this](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04) guide

