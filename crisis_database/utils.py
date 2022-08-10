#!/usr/bin/env python3

"""
Utilities.
"""

import re
import json
import sys


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


def search_for_keywords(text: str, keywords) -> list:
    """
    Search for keywords in string.

    :param text: The string to search in.
    :param keywords: The keywords to search for.

    :return: A list of all found keywords.
    """

    if not keywords:
        return []

    # make sure text is lowercase, trimmed string with only alphanumeric characters
    text = re.sub(r'\W+', '', text)
    text = re.sub(r"(\w)([A-Z])", r"\1 \2", text).strip().lower()

    # search for keywords
    found = []

    for keyword in keywords:
        if keyword in text:
            found.append((keyword, text.count(keyword)))

    return found


def load_country_region_mapper() -> dict:
    """
    Loads the region mapper (A list of all countries and their regions) from json.
    """
    with open('country_region_mapping.json', 'r') as f:
        return json.load(f)




def search_matching_geojson_files_or_coords(text: str, countries: list, region_mapper=None):
    """
    Search for matching geojson files.

    :param text: The string to search in.
    :param countries: The countries to search for (ISO3 format).

    :return: A list of country files and lat / lon.
    """

    # load region mapper if not provided
    if region_mapper == None:
        region_mapper = load_country_region_mapper()

    # make countries elements uppercase
    countries = map(str.upper, countries)

    # list of returned files
    all_files = []

    # get most often occuring region
    most_often_occuring_region = (None, -1, None)


    for country in countries:
        # if the country code is not in the region mapper, skip it
        if country not in region_mapper:
            continue
        
        # use keyword search function to find matching regions in country
        results = search_for_keywords(text, region_mapper[country].keys())

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
