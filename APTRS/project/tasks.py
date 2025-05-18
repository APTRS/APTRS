# project/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Project
from utils.email_notification import send_completion_notification, send_hold_notification
import logging

logger = logging.getLogger(__name__)

@shared_task
def update_project_status():

    today = timezone.now().date()

    # Get all projects that are not completed or on hold
    projects = Project.objects.exclude(
        status__in=['Completed', 'On Hold']
    )

    for project in projects:
        # Check if project has any active, non-completed retests
        active_retests = project.projectretest_set.filter(
            is_active=True,
            is_completed=False
        ).order_by('-startdate')

        if active_retests.exists():
            # Use dates from the most recent active retest
            retest = active_retests.first()
            start_date = retest.startdate
            end_date = retest.enddate
        else:
            # Use project's own dates
            start_date = project.startdate
            end_date = project.enddate

        # Determine the appropriate status based on dates
        if today < start_date:
            new_status = 'Upcoming'
        elif start_date <= today <= end_date:
            new_status = 'In Progress'
        else:  # today > end_date
            new_status = 'Delay'

        # Update only if status has changed
        if project.status != new_status:
            project.status = new_status
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