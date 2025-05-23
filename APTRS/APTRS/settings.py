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
from celery.schedules import crontab
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
USE_DOCKER = os.getenv('USE_DOCKER')
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



#CORS Headers Security
#For Additional security add this

CORS_ALLOW_HEADERS = (
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    'cookie',
    'Set-Cookie',
    'x-requested-with'
)

CORS_EXPOSE_HEADERS = ['Content-Disposition','Set-Cookie']


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
    'configapi',
    'project',
    'rest_framework',
    'corsheaders',
    'django_filters',
    'weasyprint',
    'rest_framework_simplejwt.token_blacklist',
    'django_celery_beat',
    'storages',
    'debug_toolbar'
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
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware'
]

INTERNAL_IPS = [
    # ...
    "127.0.0.1",
    # ...
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        #'rest_framework_simplejwt.authentication.JWTAuthentication',
        'accounts.authenticate.CustomAuthentication'
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '50/minute',
        'login': '50/minute',
    }

}

ROOT_URLCONF = 'APTRS.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates')
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
'''
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    },
}
# End Sqlite3 support
'''
# Postgres DB - Install psycopg2

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['POSTGRES_DB'],
        'USER': os.environ['POSTGRES_USER'],
        'PASSWORD': os.environ['POSTGRES_PASSWORD'],
        'HOST': os.environ['POSTGRES_HOST'],
        'PORT': os.environ['POSTGRES_PORT'],
    }
}
# End Postgres support



CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv("REDIS_URL", "redis://localhost:6379/"),
        "KEY_PREFIX": "aptrs",
        "TIMEOUT": 60 * 15,  # in seconds: 60 * 15 (15 minutes)
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            #"PASSWORD": os.getenv("REDIS_PASSWORD")
        },
    }
}


CELERY_BROKER_URL = os.getenv("REDIS_URL")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL")
CELERY_TIMEZONE = os.getenv('USER_TIME_ZONE')
CELERY_WORKER_HIJACK_ROOT_LOGGER = False
CELERY_WORKER_SEND_TASK_EVENTS = False
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BEAT_SCHEDULE = {
    "update_project_status": {
        "task": "project.tasks.update_project_status",
        "schedule": crontab(hour=0, minute=0),
    },
    "flush_expired_tokens_task": {
        "task": "accounts.tasks.flush_expired_tokens_task",
        "schedule": crontab(hour=0, minute=0),
    },
    "update_cwe_json":{
        "task": "vulnerability.tasks.update_cwe_json",
        "schedule": timedelta(days=30),
    }
}

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')


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

TIME_ZONE = os.getenv('USER_TIME_ZONE')

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/



STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'

USE_S3 = os.environ.get('USE_S3', 'False') == 'True'
if USE_S3:
    AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
    AWS_S3_REGION_NAME = os.environ.get('AWS_S3_REGION_NAME')
    AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_ENDPOINT_URL = os.environ.get('AWS_S3_ENDPOINT_URL')
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = AWS_S3_ENDPOINT_URL
else:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

MEDIA_PATH = BASE_DIR
MEDIA_ROOT = os.path.join(BASE_DIR, 'media/')
CKEDITOR_UPLOAD_LOCATION = os.path.join(MEDIA_ROOT, 'poc')

ALLOWED_TAGS = ['strong', 'em', 's', 'u', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'li', 'img', 'a', 'span',
                'code', 'blockquote', 'div', 'font', 'table', 'tr', 'td', 'th','pre','figure','figcaption','sup', 'input', 'thead', 'tbody', 'i', 'mark', 'label', 'sub',
               'br' ]

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
            'format': '%(log_color)s[%(levelname)s] %(asctime)-15s - %(message)s',
            'datefmt': '%d/%b/%Y %H:%M:%S',
            'log_colors': {
                'DEBUG': 'cyan',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red,bg_white',
            },
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'color',
        },
        'rotating_logfile': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'debug.log',
            'maxBytes': 1024 * 1024 * 5,  # 5 MB
            'backupCount': 3,
            'formatter': 'standard',
        },
    },
    'root': {
        'handlers': ['console', 'rotating_logfile'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'WARNING',
            'propagate': True,
        },
        'django.db.backends': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'INFO',
            'propagate': False,
        },
        'rest_framework': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'WARNING',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'customers': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'vulnerability': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'project': {
            'handlers': ['console', 'rotating_logfile'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}


CKEDITOR_ALLOW_NONIMAGE_FILES = False

LOGIN_URL= '/accounts/login'



SIMPLE_JWT = {
'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
'REFRESH_TOKEN_LIFETIME': timedelta(minutes=60),
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
'AUTH_COOKIE': 'access_token',  # Cookie name. Enables cookies if value is set.
  'AUTH_COOKIE_DOMAIN': None,     # A string like "example.com", or None for standard domain cookie.
  'AUTH_COOKIE_SECURE': True,    # Whether the auth cookies should be secure (https:// only).
  'AUTH_COOKIE_HTTP_ONLY' : True, # Http only cookie flag.It's not fetch by javascript.
  'AUTH_COOKIE_PATH': '/',        # The path of the auth cookie.
  'AUTH_COOKIE_SAMESITE': 'Lax',
}



#CVSS 3.1 for Nessus
CVSS_BASE_SCORE_INFO = 0.0
CVSS_BASE_INFO = "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N"

CVSS_BASE_SCORE_LOW = 3.5
CVSS_BASE_LOW = "CVSS:3.1/AV:A/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N"

CVSS_BASE_SCORE_MEDIUM = 5.7
CVSS_BASE_MEDIUM = "CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:H/I:N/A:N"


CVSS_BASE_SCORE_HIGH = 7.6
CVSS_BASE_HIGH = "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:L/A:L"

CVSS_BASE_SCORE_CRITICAL = 9.6
CVSS_BASE_CRITICAL = "CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:N"

# Email Configuration
USE_EMAIL = os.getenv('USE_EMAIL')
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.example.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Automated Penetration Test Reporting System <support@aptrs.com>')

# Email timeout settings
EMAIL_TIMEOUT = int(os.getenv('EMAIL_TIMEOUT', 60))  # seconds

# Configure if using an email service with rate limits
EMAIL_THROTTLE = os.getenv('EMAIL_THROTTLE', 'False') == 'True'
EMAIL_THROTTLE_RATE = int(os.getenv('EMAIL_THROTTLE_RATE', 100))  # Max emails per day

# Frontend URL for email links
FRONTEND_URL = os.getenv('FRONTEND_URL')

