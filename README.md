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
- use something like `pm2` to keep track of running the two scripts
- use command `grunt` or `grunt watch --force` to keep be sure minified js is up to date

## helpful tips

- create postgres user in `psql` prompt with `CREATE ROLE name WITH SUPERUSER LOGIN;
- copy one postgres database to another server with `pg_dump -C dbname | bzip2 | ssh  remoteuser@remotehost "bunzip2 | psql dbname"`
- convert color of icon and keep transperancy: `convert *.png -fill "#ffffff" -colorize 100`
- have a look at [this](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04) guide
- start `pm2` process with watching: `pm2 start file --watch`
- minify [html](https://github.com/kangax/html-minifier), [css](https://github.com/cssnano/cssnano) and [JS](https://github.com/mishoo/UglifyJS)
- [nginx https](https://certbot.eff.org/)
