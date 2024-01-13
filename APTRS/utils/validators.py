from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
from html.parser import HTMLParser
import re


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


    return value  




class UppercaseValidator(object):

    '''The password must contain at least 1 uppercase letter, A-Z.'''
    def validate(self, password, user=None):
        if not re.findall('[A-Z]', password):
            raise ValidationError(
                _("The password must contain at least 1 uppercase letter, A-Z."),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 1 uppercase letter, A-Z."
        )


class SpecialCharValidator(object):

    ''' The password must contain at least 1 special character @#$%!^&* '''
    def validate(self, password, user=None):
        if not re.findall('[@#$%!^&*]', password):
            raise ValidationError(
                _("The password must contain at least 1 special character: " +
                  "@#$%!^&*"),
                code='password_no_symbol',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 1 special character: " +
            "@#$%!^&*"
        )
    

class MinimumLengthValidator:
    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _("This password must contain at least %(min_length)d characters."),
                code='password_too_short',
                params={'min_length': self.min_length},
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least %(min_length)d characters."
            % {'min_length': self.min_length}
        )