from django import template
from django.conf import settings
from django.utils.safestring import SafeString
import bleach

ALLOWED_TAGS = settings.ALLOWED_TAGS
HTML_ATTRIBUTE = {'a': ['href', 'title'], 'img': ['src']}
register = template.Library()

@register.filter(name='clean_html')
def clean_html(value):
    cleaned_html = bleach.clean(value, tags=ALLOWED_TAGS, attributes=HTML_ATTRIBUTE)
    return SafeString(cleaned_html)
    #return SafeString(value)