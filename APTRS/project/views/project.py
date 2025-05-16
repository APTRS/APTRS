import logging

import bleach
from django.core.exceptions import ObjectDoesNotExist
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status, views
from rest_framework.decorators import (api_view, permission_classes)
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.response import Response
from django.db.models import Q, Exists, OuterRef
from django.utils import timezone
from utils.filters import (ProjectFilter,
                           paginate_queryset)
from utils.permissions import custom_permission_required
from utils.validators import get_base_url
from ..models import (Project, ProjectRetest)
from ..report import CheckReport
from ..serializers import (Projectserializers, UpdateProjectOwnerSerializer)
from ..tasks import send_completion_email_async, send_hold_email_async
from utils.token import create_image_access_token
from .validation import validate_project_completeness
logger = logging.getLogger(__name__)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def newproject(request):
    serializer = Projectserializers(data=request.data, context={'request': request})

    if serializer.is_valid(raise_exception=True):
        serializer.save()
        logger.info("Project Creted by %s", request.user)
        return Response(serializer.data)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def project_edit(request, pk):
    try:
        #project = Project.objects.get(pk=pk)
        project = Project.objects.prefetch_related('owner').select_related('companyname').get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found with pk=%s", pk)

        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = Projectserializers(instance=project, data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):

        serializer.save()
        respdata = {'Status': "Success"}
        respdata.update(serializer.data)
        logger.info("Project updated by %s for Project id=%s", request.user, pk)
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Assign Projects'])
def update_project_owner_view(request):
    serializer = UpdateProjectOwnerSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
        _ = serializer.update_project(serializer.validated_data)
        return Response({"message": "Project owner updated successfully"}, status=status.HTTP_200_OK)

    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getproject(request, pk):
    try:
        # First get the project with all required relations
        project = Project.objects.prefetch_related('owner').select_related('companyname').get(pk=pk)
        user_company_id = request.user.company.id

        # Check permissions:
        # 1. Staff and admin can access any project
        # 2. Customer users can only access projects from their company
        if not request.user.is_staff and not request.user.is_superuser:
            # Companyname check - regular users can only view projects from their company            print("user_company_id",user_company_id)
            if user_company_id != project.companyname.id:
                logger.warning(
                    "Access denied: User %s attempted to access project %s from different company",
                    request.user.username, pk
                )
                return Response({"message": "You are not authorized to view this project"}, status=status.HTTP_403_FORBIDDEN)

    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = Projectserializers(project, many=False, context={'request': request})
    return Response(serializer.data)






class GetAllProjects(views.APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    @method_decorator(cache_page(60 * 60 * 2))
    def get(self, request):
        projects = Project.objects.prefetch_related('owner').select_related('companyname').all()
        serializer = Projectserializers(projects, many=True)
        return Response(serializer.data)



class GetMyProjects(views.APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get(self, request):
        # Get projects owned by the current user that are not completed
        projects = Project.objects.filter(
            Q(owner=request.user) &
            Q(status__in=['Upcoming', 'In Progress', 'Delay', 'On Hold'])
        )

        # Get projects with active, non-completed retests
        retest_exists = ProjectRetest.objects.filter(
            project=OuterRef('pk'),
            owner=request.user,
            is_active=True,
            is_completed=False
        ).values('pk')

        # Find projects with active retests
        projects_with_retests = Project.objects.filter(Exists(retest_exists))

        combined_projects = (projects | projects_with_retests).distinct()
        combined_projects = combined_projects.prefetch_related('owner').select_related('companyname')

        serializer = Projectserializers(combined_projects, many=True)
        response_data = {
            "results": serializer.data
        }
        return Response(response_data)



@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def getallproject_filter(request):
    sort_order = request.GET.get('order_by', 'desc')
    sort_field = request.GET.get('sort', 'id') or 'id'

    cache_key = 'all_project_data'
    projects = cache.get(cache_key)

    if not projects:
        projects = Project.objects.all()
        cache.set(cache_key, projects, timeout=3600)

    project_filter = ProjectFilter(request.GET, queryset=projects)

    filtered_queryset = project_filter.qs
    if sort_order == 'asc':
        filtered_queryset = filtered_queryset.order_by(sort_field)
    else:
        filtered_queryset = filtered_queryset.order_by('-'+sort_field)

    paginator, paginated_queryset = paginate_queryset(filtered_queryset, request)
    serializer = Projectserializers(paginated_queryset, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def deleteproject(request):
    projects = Project.objects.filter(id__in=request.data)
    projects.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def complete_project_status(request, pk):
    safe_pk = bleach.clean(pk)
    try:
        project = Project.objects.get(pk=safe_pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", safe_pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    # Validate project completeness before processing
    validation_result = validate_project_completeness(pk)
    if not validation_result['valid']:
        logger.warning(f"Project {pk} completeness validation failed: {validation_result['errors']}")
        return Response({
            "status": "Failed",
            "message": "Project cannot be marked as complete due to validation failures",
            "validation_errors": validation_result['errors'],
            "details": validation_result['details']
        }, status=status.HTTP_400_BAD_REQUEST)

    # Set the project status to 'Completed'
    project.status = 'Completed'
    project.save()


    project.vulnerability_set.all().update(
        published=True,
        published_date=timezone.now()
    )
    logger.info("All vulnerabilities for project ID %s marked as published", safe_pk)

    ProjectRetest.objects.filter(
    project=project,
    is_completed=False  # Only update retests that aren't already completed
    ).update(
        is_completed=True,
        is_active=False
    )
    logger.info("All retests for project ID %s marked as completed", safe_pk)

    send_completion_email_async.delay(project.id)
    logger.info("Project completion email notification queued for project ID %s", safe_pk)

    return Response({
        'message': f'Status of project {safe_pk} updated to Completed',
        'vulnerabilities_published': True
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def reopen_project_status(request, pk):
    safe_pk = bleach.clean(pk)
    try:
        project = Project.objects.get(pk=safe_pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", safe_pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    # Set the project status back to active (In Progress)
    project.status = 'In Progress'
    project.save()

    # Find any retests that are on hold (is_active=False AND is_completed=False)
    # and reactivate them when reopening the project
    retests_updated = ProjectRetest.objects.filter(
        project=project,
        is_active=False,
        is_completed=False  # Only retests that are on hold (inactive but not completed)
    ).update(is_active=True)

    if retests_updated > 0:
        logger.info("Reactivated %s on-hold retests for project ID %s", retests_updated, safe_pk)

    latest_status = project.calculate_status

    return Response({
        'message': f'Status of project {safe_pk} updated',
        'latest_status': latest_status,
        'retests_reactivated': retests_updated > 0
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def hold_project_status(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    # Get reason_for_hold from request data
    reason_for_hold = request.data.get('reason_for_hold', '')

    project.status = 'On Hold'
    project.hold_reason = reason_for_hold  # Store the reason for hold
    project.save()

    # Update all active, non-completed retests to inactive
    ProjectRetest.objects.filter(
        project=project,
        is_active=True,
        is_completed=False  # Only retests that are active and not completed
    ).update(is_active=False)

    send_hold_email_async.delay(project.id)

    return Response({
        'message': f'Status of project {pk} updated to On Hold',
        'latest_status': project.status,
        'reason_for_hold': reason_for_hold
    })



def report_validation(report_type,project, is_customer):

    # Validating report type
    if report_type not in ['Audit', 'Re-Audit']:
            return Response({"Status": "Failed", "Message": "Report type is incorrect. Only Audit or Re-Audit are supported"}, status=status.HTTP_400_BAD_REQUEST)

    # Checking if Re-Audit report type is requested and if project has retests or incomplete retests
    if report_type == 'Re-Audit':
        if not ProjectRetest.objects.filter(project=project).exists():
            return Response({"Status": "Failed", "Message": "Project has no retest to generate Re-Audit report"}, status=status.HTTP_400_BAD_REQUEST)
        elif ProjectRetest.objects.filter(project=project, is_completed=False):
            return Response({"Status": "Failed", "Message": "Project has incomplete retest. fail to generate Re-Audit report"}, status=status.HTTP_400_BAD_REQUEST)

    #has_scope = PrjectScope.objects.filter(project=project).exists()
    if not project.prjectscope_set.exists():
        return Response({"Status": "Failed", "Message": "Project has no Sccope added, Kindly add Scope to generate project"})

    #Checking if project has any vulnerabilities added
    #has_vulnerabilities = Vulnerability.objects.filter(project=project).exists()
    vulnerabilities = project.vulnerability_set.all()
    if not vulnerabilities:
        return Response({"Status": "Failed", "Message": "Project has no vulnerabilities, Kindly add vulnerabilities to generate project"})

    if is_customer and not vulnerabilities.filter(published=True).exists():
        return Response({"Status": "Failed", "Message": "Project has no published vulnerabilities, Kindly publish vulnerabilities to generate project"})

    #Checking if vulnerabilities have instances added
    for vulnerability in vulnerabilities:
        if is_customer and not vulnerability.published:
            continue  # Skip unpublished vulnerabilities for customer users

        if vulnerability.instances.count() == 0:
            logger.error("Vulnerability %s has no Instance added", vulnerability.vulnerabilityname)
            response_data = {"Status": "Failed", "Message": f"Vulnerability {vulnerability.vulnerabilityname} has no Instance added, Kindly add Instance to generate project"}
            return Response(response_data)

    # If all validations pass, return None
    logger.info("All validations passed for project %s", project.id)
    return None



@api_view(['POST','GET'])
@permission_classes([IsAuthenticated])
def project_report(request, pk):
    try:
        user_company_id = request.user.company.id
        project = Project.objects.prefetch_related('owner').select_related('companyname').get(pk=pk)
        is_staff = request.user.is_staff
        is_superuser = request.user.is_superuser

        # Check if the user is a customer and if they are allowed to access the project
        if not is_staff and not is_superuser:
            if user_company_id != project.companyname.id:
                return Response({"message": "You are not authorized to view this project"}, status=status.HTTP_403_FORBIDDEN)


        report_format = request.query_params.get('Format')
        report_type = request.query_params.get('Type')

        # For staff users, allow all formats (pdf, excel, docx)
        # For non-staff users, only allow pdf and excel
        allowed_formats = ['pdf', 'excel', 'docx'] if is_staff else ['pdf', 'excel']

        if not report_format in allowed_formats:
            formats_message = "pdf, excel, and docx" if is_staff else "pdf and excel"
            logger.error(f"Report Format is incorrect. Only {formats_message} are supported for this user type")
            return Response({"Status": "Failed", "Message": f"Report Format is incorrect. Only {formats_message} are supported for your user type"})


        response = report_validation(report_type,project, is_staff)
        if response:
            return response

    except Exception as e:
        logger.error(e)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)


    url = get_base_url(request)
    standard = project.standard

    # generate new token for user to access auth protected images for report, user token in request might be close to expiry, so refreshing it to have new 30 mins token
    if not is_staff:
        access_token = create_image_access_token(request.user)
    else:
        refresh = RefreshToken.for_user(request.user)
        access_token = refresh.access_token

    print("access_token",access_token)

    output = CheckReport(report_format,report_type,pk,url,standard,request,access_token,is_staff)
    return output



