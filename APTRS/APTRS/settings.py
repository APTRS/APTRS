"""
Django settings for APTRS project.

Generated by 'django-admin startproject' using Django 4.1.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

from json import loads
from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = os.path.join(BASE_DIR, '.env')
load_dotenv(dotenv_path)

#logging.disable(logging.CRITICAL)
ADMIN_ENABLED = False


'''
Security settings, Make sure that you change the configuration before deploying the application
'''

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = loads(os.getenv('ALLOWED_HOST', '[]'))

WHITELIST_IP = loads(os.getenv('WHITELIST_IP', '[]'))

'''
CORS Security settings
Make sure to only allow the  frontend domain/IP and not all domains Check:

https://pypi.org/project/django-cors-headers/ for more examples to configure it

Remove the CORS_ORIGIN_ALLOW_ALL = True

Use this instead with appropriate domain/ip:port and protocol
CORS_ALLOWED_ORIGINS = ["https://example.com","http://127.0.0.1:9000"]  os.getenv('CORS_ORIGIN')
'''
CORS_ORIGIN_ALLOW_ALL = True


'''
CORS Headers Security
For Additional security add this

CORS_ALLOW_HEADERS = (
    "accept",
    "authorization",
    "content-type",
    "user-agent",
)

'''

#### Do Not Change this
CORS_ALLOW_CREDENTIALS = True




AUTH_USER_MODEL = 'accounts.CustomUser'


ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
#AUTH_GROUP_MODEL = 'accounts.Group'
CKEDITOR_BASEPATH = "/static/ckeditor/ckeditor/"



# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'accounts',
    'customers',
    'phonenumber_field',
    'vulnerability',
    'ckeditor',
    'ckeditor_uploader',
    'project',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'weasyprint',
    'storages',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware'
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    )
}

ROOT_URLCONF = 'APTRS.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
            os.path.join(BASE_DIR, 'frontend', 'build'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'APTRS.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases


# Sqlite3 support

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    },
}
# End Sqlite3 support

# Postgres DB - Install psycopg2
"""
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': 'aptrs',
        'USER': os.environ['POSTGRES_USER'],
        'PASSWORD': os.environ['POSTGRES_PASSWORD'],
        'HOST': os.environ['POSTGRES_HOST'],
        'PORT': 5432,
    }
}
# End Postgres support
"""


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
    ### Custom Validation for Password
    {
        'NAME': 'utils.validators.UppercaseValidator',
    },
    {
        'NAME': 'utils.validators.SpecialCharValidator',
    },
    {
        'NAME': 'utils.validators.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 10,
        }
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/



STATIC_URL = '/static/'
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static'),os.path.join(BASE_DIR, 'frontend','build','static')]

#STATIC_ROOT = os.path.join(BASE_DIR, 'static')

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
#STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


MEDIA_URL = '/media/'
#MEDIA_URL2 = '/media/'
MEDIA_PATH = os.path.join(BASE_DIR, 'static')
MEDIA_ROOT = os.path.join(MEDIA_PATH, 'media')
Company_LOGO = os.path.join(MEDIA_URL, 'company')
CKEDITOR_UPLOAD_LOCATION = os.path.join(MEDIA_ROOT, 'uploads')
CKEDITOR_UPLOAD_URL = os.path.join(MEDIA_URL, 'uploads')
CKEDITOR_UPLOAD_PATH = "uploads/"

ALLOWED_TAGS = ['strong', 'em', 's', 'u', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'img', 'a', 'span',
                'code', 'blockquote', 'div', 'font', 'table', 'tr', 'td', 'th','pre'
                ]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '[%(levelname)s] %(asctime)-15s - %(message)s',
            'datefmt': '%d/%b/%Y %H:%M:%S',
        },
        'color': {
            '()': 'colorlog.ColoredFormatter',
            'format':
                '%(log_color)s[%(levelname)s] %(asctime)-15s - %(message)s',
            'datefmt': '%d/%b/%Y %H:%M:%S',
            'log_colors': {
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            },
        },
    },'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'color',
        },
        'logfile': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': os.getenv('LOG_FILE_LOCATION'),
            'formatter': 'standard',
        },
    },
    'loggers': {
        'django': {
    'handlers': ['console', 'logfile'],
    'level': 'WARNING',
    'propagate': True,
},
'django.db.backends': {
    'handlers': ['console', 'logfile'],
    'level': 'INFO',
    'propagate': False,
},
'rest_framework':{
    'handlers': ['console', 'logfile'],
    'level': 'WARNING',
    'propagate': False,},

        'accounts': {
            'handlers': ['console', 'logfile'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'customers': {
            'handlers': ['console', 'logfile'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'vulnerability': {
            'handlers': ['console', 'logfile'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'project': {
            'handlers': ['console', 'logfile'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

CKEDITOR_ALLOW_NONIMAGE_FILES = False

LOGIN_URL= '/accounts/login'





SIMPLE_JWT = {
'ACCESS_TOKEN_LIFETIME': timedelta(days=30),
'REFRESH_TOKEN_LIFETIME': timedelta(days=15),
'ROTATE_REFRESH_TOKENS': True,
'BLACKLIST_AFTER_ROTATION': True,
'ALGORITHM': 'HS256',
'SIGNING_KEY': os.getenv('SECRET_KEY'),
'VERIFYING_KEY': None,
'AUTH_HEADER_TYPES': ('Bearer',),
'USER_ID_FIELD': 'id',
'USER_ID_CLAIM': 'user_id',
'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
'TOKEN_TYPE_CLAIM': 'token_type',
}

#Your Organization Details
ORG = os.getenv('YOUR_COMPANY')
LOGO = os.getenv('YOUR_COMPANY_LOGO')
if LOGO:
    MY_ORG_LOGO = os.path.join(MEDIA_ROOT, 'company',LOGO)
else:
    MY_ORG_LOGO = None

#CVSS 3.1 for Nessus
CVSS_BASE_SCORE_INFO = 0.0
CVSS_BASE_INFO = "CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:U/C:N/I:N/A:N"

CVSS_BASE_SCORE_LOW = 3.5
CVSS_BASE_LOW = "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:N/A:N"

CVSS_BASE_SCORE_MEDIUM = 5.7
CVSS_BASE_MEDIUM = "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:H/I:N/A:N"


CVSS_BASE_SCORE_HIGH = 3.5
CVSS_BASE_HIGH = "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:N/A:N"

CVSS_BASE_SCORE_CRITICAL = 3.5
CVSS_BASE_CRITICAL = "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:L/I:N/A:N"
