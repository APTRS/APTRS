# project/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Project, ProjectRetest
from utils.email_notification import send_completion_notification, send_hold_notification
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_project_status():
    today = timezone.now().date()

    project_retests = ProjectRetest.objects.filter(status__in=['Upcoming', 'In Progress', 'Delay'])
    for retest in project_retests:
        if retest.startdate > today:
            retest.status = 'Upcoming'
        elif retest.startdate <= today <= retest.enddate:
            retest.status = 'In Progress'
        elif today > retest.enddate:
            retest.status = 'Delay'
        retest.save()

    # Only fetch projects that are not completed
    projects = Project.objects.filter(status__in=['Upcoming', 'In Progress', 'Delay'])

    for project in projects:
        # Update based on the project's own dates
        if project.startdate > today:
            project.status = 'Upcoming'
        elif project.startdate <= today <= project.enddate:
            project.status = 'In Progress'
        elif today > project.enddate:
            project.status = 'Delay'
        project.save()

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