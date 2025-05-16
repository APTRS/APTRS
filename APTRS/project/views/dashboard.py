import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q

from ..models import Project, ProjectRetest
from ..serializers import Projectserializers, Retestserializers

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    """
    API endpoint to get aggregated dashboard data for both projects and retests.
    Returns counts of projects and retests by status, and details for each item.
    """
    try:
        current_date = timezone.now().date()
        user = request.user

        # Initialize status counts and data containers
        status_data = {
            'Delay': {'count': 0, 'projects': [], 'retests': []},
            'In Progress': {'count': 0, 'projects': [], 'retests': []},
            'On Hold': {'count': 0, 'projects': [], 'retests': []},
            'Upcoming': {'count': 0, 'projects': [], 'retests': []},
        }

        # Get projects for the current user
        projects = Project.objects.filter(
            ~Q(status='Completed'),
            owner=user
        ).select_related('companyname')

        # Get retests where user is directly an owner - include both active and on-hold retests
        user_retests = ProjectRetest.objects.filter(
            is_completed=False,  # Not completed
            owner=user
        ).select_related('project__companyname')

        # Identify projects that have active retests (to exclude them from the projects list)
        projects_with_active_retests = set(retest.project.id for retest in user_retests if not retest.is_completed)

        # Process each project - exclude those with active retests
        for project in projects:
            # Skip projects that have active retests
            if project.id in projects_with_active_retests:
                continue

            # Use the existing project status - map to our dashboard status keys
            if project.status == 'On Hold':
                status_key = 'On Hold'
            elif project.status == 'Upcoming':
                status_key = 'Upcoming'
            elif project.status == 'In Progress':
                status_key = 'In Progress'
            elif project.status == 'Delay':
                status_key = 'Delay'
            else:
                continue  # Skip other statuses like Completed

            # Serialize project data to include only required fields
            project_data = {
                'id': project.id,
                'name': project.name,
                'company_name': project.companyname.name if project.companyname else '',
                'start_date': project.startdate,
                'end_date': project.enddate,
                'testing_type': project.testingtype,
                'status': status_key,
                'project_type': project.projecttype,
            }

            # Add to appropriate status category
            status_data[status_key]['projects'].append(project_data)
            status_data[status_key]['count'] += 1

        # Process each retest
        for retest in user_retests:
            # Determine retest status
            # First check if it's on hold (not active and not completed)
            if not retest.is_active and not retest.is_completed:
                status_key = 'On Hold'
            elif current_date < retest.startdate:
                status_key = 'Upcoming'
            elif retest.startdate <= current_date <= retest.enddate:
                status_key = 'In Progress'
            elif current_date > retest.enddate:
                status_key = 'Delay'
            else:
                continue  # Skip if no valid status
              # Serialize retest data
            retest_data = {
                'id': retest.id,
                'project_id': retest.project.id,
                'project_name': retest.project.name,
                'company_name': retest.project.companyname.name if retest.project.companyname else '',
                'start_date': retest.startdate,
                'end_date': retest.enddate,
                'status': status_key,
            }

            # Add to appropriate status category
            status_data[status_key]['retests'].append(retest_data)
            status_data[status_key]['count'] += 1

        # Format final response
        response_data = {
            'status_counts': {
                'Delayed': status_data['Delay']['count'],
                'In_Progress': status_data['In Progress']['count'],
                'On_Hold': status_data['On Hold']['count'],
                'Upcoming': status_data['Upcoming']['count'],
            },
            'projects': {
                'Delayed': status_data['Delay']['projects'],
                'In_Progress': status_data['In Progress']['projects'],
                'On_Hold': status_data['On Hold']['projects'],
                'Upcoming': status_data['Upcoming']['projects'],
            },
            'retests': {
                'Delayed': status_data['Delay']['retests'],
                'In_Progress': status_data['In Progress']['retests'],
                'On_Hold': status_data['On Hold']['retests'],
                'Upcoming': status_data['Upcoming']['retests'],
            },
        }

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error fetching dashboard data: {str(e)}")
        return Response(
            {"error": "Failed to fetch dashboard data", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
