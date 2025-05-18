# project/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Project, ProjectRetest
from utils.email_notification import send_completion_notification, send_hold_notification
from utils.project_status import update_all_projects_status
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_project_status():
    update_all_projects_status()

@shared_task
def send_completion_email_async(entity_id):
    """
    Asynchronously send a project completion email.
    This ensures the UI remains responsive while emails are processed in the background.

    Args:
        entity_id (int): ID of the completed project
    """
    send_completion_notification(entity_id, False)


@shared_task
def send_completion_retest_email_async(entity_id):
    """
    Asynchronously send a retest completion email.
    This ensures the UI remains responsive while emails are processed in the background.

    Args:
        entity_id (int): ID of the completed retest
    """
    send_completion_notification(entity_id, True)

@shared_task
def send_hold_email_async(entity_id):

    send_hold_notification(entity_id, False)

@shared_task
def send_hold_retest_email_async(entity_id):

    send_hold_notification(entity_id, True)