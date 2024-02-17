import re
from html.parser import HTMLParser
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

ALLOWED_TAGS = settings.ALLOWED_TAGS

class TagValidator(HTMLParser):
    def __init__(self, allowed_path='/media/'):
        super().__init__()
        self.allowed_path = allowed_path
        self.disallowed_tags = set()
        self.disallowed_imgs = []

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.validate_img_src(attrs)
        elif tag not in ALLOWED_TAGS:
            self.disallowed_tags.add(tag)

    def validate_img_src(self, attrs):
        for attr, value in attrs:
            if attr.lower() == 'src':
                if value is None:
                    raise ValidationError(_("Image source cannot be None"))
                #elif not value.startswith(self.allowed_path):
                #    self.disallowed_imgs.append(value)


def xss_validator(value):
    validator = TagValidator()
    validator.feed(value)

    if validator.disallowed_tags:
        disallowed_tags_str = ", ".join(validator.disallowed_tags)
        raise ValidationError(_("Only whitelisted tags are allowed"+disallowed_tags_str))

    if validator.disallowed_imgs:
        disallowed_img_str = ", ".join(validator.disallowed_imgs)
        raise ValidationError(_("Only images from the whitelisted paths are allowed"+disallowed_img_str))

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
            f"Your password must contain at least {self.min_length} characters."
        )
