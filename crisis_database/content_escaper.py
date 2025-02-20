#!/usr/bin/env python3

"""
Handles the escaping of content for the database.
"""

from utils import escape
import re
from html.parser import HTMLParser


class FirstParagraphExtractor(HTMLParser):
    """Extracts only the first paragraph from HTML."""
    def __init__(self):
        super().__init__()
        self.first_paragraph = None
        self.current_text = []
        self.inside_p = False

    def handle_starttag(self, tag, attrs):
        if tag == "p" and self.first_paragraph is None:
            self.inside_p = True

    def handle_endtag(self, tag):
        if tag == "p" and self.inside_p:
            self.first_paragraph = " ".join(self.current_text).strip()
            self.inside_p = False

    def handle_data(self, data):
        if self.inside_p:
            self.current_text.append(data.strip())

def extract_first_paragraph(text):
    """Extracts the first paragraph from HTML or plain text."""
    if "<p>" in text.lower():  # Check if it's HTML
        parser = FirstParagraphExtractor()
        parser.feed(text)
        return parser.first_paragraph if parser.first_paragraph else ""
    else:  # Handle plain text
        return re.split(r"\n\n+|\r\r+|\n\r+", text.strip())[0] if text.strip() else ""


def escape_content(string, continue_src, continue_link, max_length=2000):
    """
    Extracts and escapes the first paragraph or the first max_length characters (whichever is shorter).
    
    :param string: The original text (can be HTML or plain text).
    :param continue_string: The "Read more" link.
    :param max_length: Maximum number of characters to display if the paragraph is too long.
    :return: Processed content with a "Read more" link.
    """
    
    # if is empty string
    if not string:
        return ""

    first_paragraph = extract_first_paragraph(string)

    # Trim to max_length if needed
    if len(first_paragraph) > max_length:
        first_paragraph = first_paragraph[:max_length].rsplit(" ", 1)[0] + "..."

    final = f'{first_paragraph} <p></p><p>[...]&nbsp;<a href="{continue_link}" target="_blank" style="color: #4682B4"><b>Click here to read full article on {continue_src}</b></a></p>'
    return escape(final)


if __name__ == '__main__':
    # Test the function
    html_text = "<p>Dies ist der erste Absatz.</p><p>Dies ist der zweite Absatz.</p>"
    plain_text = "Dies ist der erste Absatz.\n\nDies ist der zweite Absatz."

    print(escape_content(html_text, "IPS News", "https://google.com"))
    print(escape_content(plain_text, "IPS News", "https://google.com"))
