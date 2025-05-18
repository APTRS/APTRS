from django.utils import timezone


def update_project_status(project):
    """
    Update the status of a single project based on its start and end dates,
    or its active retests' dates if available.

    Args:
        project: A Project model instance


    """    # Skip if project is completed or on hold
    if project.status in ['Completed', 'On Hold']:
        return

    today = timezone.now().date()

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
        new_status = 'Delay'    # Update only if status has changed
    if project.status != new_status:
        project.status = new_status


