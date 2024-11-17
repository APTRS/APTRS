# myapp/tasks.py
from celery import shared_task
from django.core.management import call_command

@shared_task
def flush_expired_tokens_task():
    call_command('flushexpiredtokens')
