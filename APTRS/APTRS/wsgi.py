"""
WSGI config for APTRS project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application
from .init import current_version


BANNER, COPYRIGHT = current_version()


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'APTRS.settings')
application = get_wsgi_application()
print(BANNER+ COPYRIGHT)
