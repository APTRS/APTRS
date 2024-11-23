from django import template
from django.conf import settings
from django.utils.safestring import SafeString
from bleach.css_sanitizer import CSSSanitizer
import bleach

ALLOWED_TAGS = settings.ALLOWED_TAGS
HTML_ATTRIBUTE = {
    '*': ['style'],
    'a': ['href', 'title'],
    'img': ['src'],
    'span': ['style'],
}
ALLOWED_STYLES = [
    'font-size', 'font-family', 'color', 'background-color', 'font-weight', 'font-style', 'text-align',
    'text-decoration', 'line-height', 'margin', 'padding', 'border', 'display'
]
css_sanitizer = CSSSanitizer(allowed_css_properties=ALLOWED_STYLES)

register = template.Library()

@register.filter(name='clean_html')
def clean_html(value):
    cleaned_html = bleach.clean(value, tags=ALLOWED_TAGS, attributes=HTML_ATTRIBUTE,css_sanitizer=css_sanitizer)
    return SafeString(cleaned_html)
    #return SafeString(value)
