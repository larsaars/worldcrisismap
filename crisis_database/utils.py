#!/usr/bin/env python3

"""
Utilities.
"""

import re
import json
import sys
from unidecode import unidecode
import os
from bs4 import BeautifulSoup


def printerr(*args, **kwargs):
    """
    Prints an error message to the console.
    """
    print(*args, file=sys.stderr, **kwargs)


def escape(string):
    """
    Escape dangerous characters for database in string.

    :param string: The string to escape.
    """
    return string.replace('\'', '&#39;').replace('"', '&quot;').replace('\\', '\\\\').replace('\n', '<br>')


def search_for_keywords(text: str, keywords, is_html=False) -> list:
    """
    Search for keywords in string.

    :param text: The string to search in.
    :param keywords: The keywords to search for.

    :return: A list of all found keywords.
    """

    if not keywords:
        return []

    # make to text if is html
    if is_html:
        text = BeautifulSoup(text, features='html.parser').get_text()

    # remove accents
    text = unidecode(text)

    # make sure text is lowercase, trimmed string with only alphanumeric characters
    text = text.lower().strip()  # lowercase and trim
    text = re.sub(r'[^a-z0-9 ]+', '', text)  # lower alphanumeric characters only
    text = ' ' + re.sub(r'\s+', ' ', text)  # remove multiple spaces and put a space in front to be able to find if keyword is at beginning of text

    # search for keywords
    found = []

    for keyword in keywords:
        # unidecode keyword, strip, lowercase
        # put a space in front of keyword, so that it is not part of another word 
        keyword = ' ' + unidecode(keyword.strip().lower())
        # count the occurences in text
        count_in_text = text.count(keyword)

        # if is larger 1, add to found
        if count_in_text >= 1:
            found.append((keyword.strip(), count_in_text))

    return found


def load_country_region_mapper_and_country_code_mapper(change_dir=True) -> dict:
    """
    Switch to correct relative path.

    Loads the region mapper (A list of all countries and their regions) from json.
    And loads the country code mapper (A list of all countries and their ISO3 codes) from json.
    """
    # switch to script dir
    if change_dir:
        os.chdir(os.path.dirname(sys.argv[0]))

    # load mappers
    with open('country_region_mapping.json', 'r') as f:
        country_region_mapping = json.load(f)

    with open('country_code_mapping.json', 'r') as f:
        country_code_mapping = json.load(f)

    return country_region_mapping, country_code_mapping



def search_matching_geojson_files_or_coords(text: str, countries: list, mappers=None, is_html=False):
    """
    Search for matching geojson files.

    :param text: The string to search in.
    :param countries: The countries to search for (ISO3 format).

    :return: A list of country files and lat / lon.
    """

    # load region mapper if not provided
    if mappers == None:
        region_mapper, country_code_mapper = load_country_region_mapper_and_country_code_mapper()
    else:
        region_mapper, country_code_mapper = mappers



    # if no countries are provided, search for country names in text (but only the one with most occurences, since else the map would be overpopulated)
    if not countries:
        country_max = (None, -1)

        # search for country name in text
        found = search_for_keywords(text, country_code_mapper.keys(), is_html)

        # add found countries' codes to countries list
        for country, count in found:
            if count > country_max[1]:
                country_max = (country_code_mapper[country], count)

        # add country to countries list
        # if is not None country
        if country_max[0] != None:
            countries = [country_max[0]]

    # make countries elements uppercase
    countries = map(str.upper, countries)

    # list of returned files
    all_files = []

    # get most often occuring region
    most_often_occuring_region = (None, -1, None)

    # loop through all countries found
    for country in countries:
        # if the country code is not in the region mapper, skip it
        if country not in region_mapper:
            continue
        
        # use keyword search function to find matching regions in country
        results = search_for_keywords(text, region_mapper[country].keys(), is_html=is_html)

        # if no results for regions, just add country file,
        # else return region files
        if results:
            for res, count in results: 
                # count in for most often occuring region
                if count > most_often_occuring_region[1]:
                    most_often_occuring_region = (res, count, country)

                # append
                all_files.append(f'regions/{country}/{res.replace(" ", "_")}.json')
        else:
            all_files.append(f'countries/{country}.json')

    
    # if most often occuring region exists, return its lat / lon
    # else return for lat / lon None, the information is delivered by API
    if most_often_occuring_region[0] is not None:
        region = region_mapper[most_often_occuring_region[2]][most_often_occuring_region[0]]
        lat, lon = region['lat'], region['lon']
    else:
        lat, lon = None, None

    
    return all_files if all_files else None, lat, lon
