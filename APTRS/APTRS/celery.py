from __future__ import absolute_import, unicode_literals
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'APTRS.settings')
app = Celery('APTRS')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()


app.conf.beat_schedule = {
    'update_project_status_daily': {
        'task': 'project.tasks.update_project_status',
        'schedule': crontab(hour=0, minute=0),
    },
    'flush-expired-tokens-every-day': {
        'task': 'accounts.tasks.flush_expired_tokens_task',
        'schedule': crontab(minute=0, hour=0),
    },
}