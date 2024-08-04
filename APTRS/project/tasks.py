# project/tasks.py
from celery import shared_task
from django.utils import timezone
from .models import Project, ProjectRetest
from django.db.models import Q

@shared_task(name="project_status")
def update_project_status():
    today = timezone.now().date()
    
    # Update ProjectRetest statuses
    project_retests = ProjectRetest.objects.filter(status__in=['Upcoming', 'In Progress', 'Delay'])
    for retest in project_retests:
        if retest.startdate > today:
            retest.status = 'Upcoming'
        elif retest.startdate <= today <= retest.enddate:
            retest.status = 'In Progress'
        elif today > retest.enddate:
            retest.status = 'Delay'
        retest.save()
    
    # Update Project statuses
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
    
    # Update Projects with ongoing retests
    # Fetch projects with retests that are not completed
    projects_with_retests = Project.objects.filter(
        projectretest__status__in=['Upcoming', 'In Progress', 'Delay']
    ).distinct()

    for project in projects_with_retests:
        # Check the status of the associated retests
        ongoing_retests = ProjectRetest.objects.filter(project=project, status__in=['Upcoming', 'In Progress', 'Delay'])
        if ongoing_retests.exists():
            # Set project status to the status of the ongoing retest
            project.status = ongoing_retests.first().status
            project.save()
