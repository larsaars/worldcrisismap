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
    :param mappers: The mappers to use.
    :param is_html: If the text is html.

    :return: A list of country files and lat / lon as well as last max country.
    """

    # load region mapper if not provided
    if mappers == None:
        region_mapper, country_code_mapper = load_country_region_mapper_and_country_code_mapper()
    else:
        region_mapper, country_code_mapper = mappers

    
    # create max lat / lon, they are provided if searching for countries as centers
    # and none if nothing found
    max_lat, max_lon = None, None

    # define last max country (max country name to be returned)
    last_max_country = None

    # if no countries are provided, search for country names in text (but only the one with most occurences, since else the map would be overpopulated)
    if not countries:
        country_max = (None, None, -1)

        # init countries list
        countries = []

        # search for country name in text
        found = search_for_keywords(text, country_code_mapper.keys(), is_html)

        # if nothing was found, return
        if not found:
            return None, None, None, None


        # accumulate founds with same country iso3 code
        # (in some cases there are multiple country names for one iso3 code)

        # first element is the country iso3 code, second element is the country name and the third element is the count
        found = [(country_code_mapper[country]['iso3'], country, count) for country, count in found]


        # if two items have same iso3 code, add the count
        found_accumulated = []
        for country_iso3, country_name, count in found:
            if country_iso3 not in [iso3 for iso3, _, _ in found_accumulated]:
                found_accumulated.append((country_iso3, country_name, count))
            else:
                for i, (iso3_, country_name_, count_) in enumerate(found_accumulated):
                    if iso3_ == country_iso3:
                        found_accumulated[i] = (iso3_, country_name_, count_ + count)


        # also compare to get the country with most occurences
        for iso3, country, count in found_accumulated:
        # also compare to get the country with most occurences
            if count > country_max[2]:
                country_max = (iso3, country, count)

        # add countrie(s) with most occurences to country list
        # this is done in order to not have too many countries on the map for just one article
        for iso3, country, count in found_accumulated:
            if count == country_max[2]:
                countries.append(iso3)


        # set as variable for later use
        last_max_country = country_max[1]
        max_lat, max_lon = country_code_mapper[last_max_country]['lat'], country_code_mapper[last_max_country]['lon']


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
    # else return for lat / lon None, the information is delivered by API or determined elsehow
    if most_often_occuring_region[0] is not None:
        region = region_mapper[most_often_occuring_region[2]][most_often_occuring_region[0]]
        lat, lon = region['lat'], region['lon']
    else:
        lat, lon = max_lat, max_lon

    
    return all_files if all_files else None, lat, lon, last_max_country


def infer_type_by_title(title):
    """
    Infer the type of the article by its title.

    :param title: The title of the article.
    :return: The type of the article.
    """
    # dict of keywords
    keywords = {
        'gay': 'lqtbqplus', 'lgtbq': 'lgtbqplus', 'queer': 'lgtbqplus', 'lgbtqi': 'lgtbqplus', 'lgtbqplus': 'lgtbqplus',
        'escape': 'fleeing', 'refugee': 'fleeing', 'fleeing': 'fleeing', 'safe route': 'fleeing', 'legal route': 'fleeing', 'migrant': 'fleeing', 'migration': 'fleeing', 'camp': 'fleeing', 'population movement': 'fleeing', 'displacement': 'fleeing', 'displaced': 'fleeing',
        'climate': 'climate_change', 'energy': 'climate_change', 'environment': 'climate_change', 'hydrogen': 'climate_change', 'sustainable': 'climate_change', 'sustainability': 'climate_change', 'biodiversity': 'climate_change', 'green fuel': 'climate_change',
        'poverty': 'money', 'money': 'money', 'business': 'money', 'bank': 'money', 'economy': 'money', 'economist': 'money', 'debt': 'money', 'financial': 'money', 'stock': 'money', 'credit': 'money', 'fund': 'money', 'inflation': 'money', 'corruption': 'money', 'trading': 'money',
        'digital': 'technology', 'technology': 'technology', 'internet': 'technology', 'tech': 'technology',
        'covid': 'epidemic', 'epidemic': 'epidemic', 'corona': 'epidemic', 'pandemic': 'epidemic', 'virus': 'epidemic', 'disease': 'epidemic', 'infection': 'epidemic', 'fever': 'epidemic', 'cholera': 'epidemic', 'ebola': 'epidemic', 'vaccinate': 'epidemic', 'vaccination': 'epidemic',
        'human right': 'human_rights', 'journalist': 'human_rights', 'protection': 'human_rights', 'homeless': 'human_rights', 'humanitarian': 'human_rights', 'discrimination': 'human_rights', 'racis': 'human_rights', 'social crisis': 'human_rights', 'antisemit': 'human_rights', 'inigenous': 'human_rights', 'multilateralism': 'human_rights',
        'education': 'education', 'school': 'education', 'study': 'education', 'university': 'education', 'student': 'education', 'teacher': 'education', 'teaching': 'education', 'learning': 'education', 'learn': 'education', 'teach': 'education', 'education': 'education', 'school': 'education', 'study': 'education', 'university': 'education', 'student': 'education', 'teacher': 'education', 'teaching': 'education', 'learning': 'education', 'learn': 'education', 'teach': 'education',
        'disabilities': 'disabilities', 'disabled': 'disabilities',
        'health': 'health', 'pollution': 'health',
        'food': 'food', 'nutrition': 'food', 'hungry': 'food', 'hunger': 'food', 'drought': 'food', 'agriculture': 'food', 'famine': 'food', 'malnourished': 'food', 'starve': 'food',
        'torture': 'violence', 'abuse': 'violence', 'sexual': 'violence', 'violence': 'violence', 'arms': 'violence', 'military': 'violence', 'war': 'violence', 'coup': 'violence', 'protest': 'violence', 'kill': 'violence', 'death': 'violence', 'died': 'violence', 'killed': 'violence', 'kills': 'violence', 'bloodbath': 'violence', 'security': 'violence',
        'fire': 'fire', 'burning': 'fire', 'forest fire': 'fire', 'wildfire': 'fire', 'wildfire': 'fire',
        'flood': 'flood', 'flooding': 'flood', 'rain': 'flood', 'rainfall': 'flood', 'tsunami': 'flood',
        'storm': 'storm', 'hurricane': 'storm', 'tornado': 'storm', 'cyclone': 'storm', 'typhoon': 'storm',
        'earthquake': 'earthquake', 'quake': 'earthquake', 'tremor': 'earthquake', 'trembling': 'earthquake',
        'volcano': 'volcano', 'lava': 'volcano', 'eruption': 'volcano', 'magma': 'volcano',
        'democracy': 'vote', 'election': 'vote',
    }

    # get title in lower case
    results = search_for_keywords(title, keywords.keys(), is_html=False)

    # if no results, return just info
    if not results:
        return 'report'
    else:
        # loop through results
        highest = (None, -1)
        for result, count in results:
            # return the highest
            if count > highest[1]:
                highest = (result, count)

        return keywords[highest[0]]


