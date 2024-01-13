# validators.py
from django.core.exceptions import ValidationError
from html.parser import HTMLParser

ALLOWED_TAGS = ['strong', 'em', 's', 'u', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'img', 'a', 'span', 
                'code', 'blockquote', 'div', 'font', 'table', 'tr', 'td', 'th','pre'
                ]

class TagValidator(HTMLParser):
    def __init__(self):
        super().__init__()
        self.disallowed_tags = set()

    def handle_starttag(self, tag, attrs):
        if tag not in ALLOWED_TAGS:
            self.disallowed_tags.add(tag)

def xss_validator(value):
    validator = TagValidator()
    validator.feed(value)
    
    if validator.disallowed_tags:
        raise ValidationError("Only whitelisted tags are allowed")
        # Raise an error or handle as needed

    return value  # You may choose to return the original value or sanitize it further