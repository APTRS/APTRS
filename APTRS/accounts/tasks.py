# myapp/tasks.py
from celery import shared_task
from django.core.management import call_command
from .token_utils import send_invitation_email

@shared_task
def flush_expired_tokens_task():
    call_command('flushexpiredtokens')

@shared_task
def send_email_task(email, token_type):
    """
    A Celery task to send an email for forget password.
    """
    send_invitation_email(email, token_type)