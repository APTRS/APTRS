import logging

import bleach
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.decorators import (api_view,
                                       permission_classes)
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from utils.permissions import custom_permission_required
from .validation import validate_project_completeness
from ..models import (ProjectRetest)
from ..serializers import (Retestserializers)
from ..tasks import send_completion_retest_email_async, send_hold_retest_email_async    
    
logger = logging.getLogger(__name__)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def Retestdelete(request,pk):
    try:
        retest = ProjectRetest.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)
    retest.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def RetestList(request,pk):
    retest = ProjectRetest.objects.filter(project=pk).order_by('id')
    user_company_id = request.user.company.id
    
    # Get the project first, then access its company ID
    try:
        project_company_id = retest.first().project.companyname_id if retest.exists() else None
    except AttributeError:
        project_company_id = None

    if not request.user.is_staff and not request.user.is_superuser:
        if user_company_id != project_company_id:
            print(f"User company ID: {user_company_id}")
            print(f"Project company ID: {project_company_id}")
            return Response({"message": "You do not have permission to view this Project."}, status=status.HTTP_403_FORBIDDEN)


    if not retest:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)

    else:
        serializer = Retestserializers(retest,many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def Retestadd(request):
    serializer_context = {'request': request}
    serializer = Retestserializers(data=request.data,many=False,context=serializer_context)

    if serializer.is_valid(raise_exception=True):
        serializer.save()
        logger.info("Project retest added by %s for Project id=%s", request.user, request.data.get('project'))
        return Response(serializer.data)
    else:
        logger.error("Something went wrong %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def complete_retest_status(request, pk):
    safe_pk = bleach.clean(pk)
    try:
        projectretest = ProjectRetest.objects.get(pk=safe_pk)
    except ObjectDoesNotExist:
        logger.error("Retest not found for id=%s", safe_pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)
    
    validation_result = validate_project_completeness(projectretest.project.id)
    if not validation_result['valid']:
        logger.warning(f"Project {pk} completeness validation failed: {validation_result['errors']}")
        return Response({
            "status": "Failed",
            "message": "Project cannot be marked as complete due to validation failures",
            "validation_errors": validation_result['errors'],
            "details": validation_result['details']
        }, status=status.HTTP_400_BAD_REQUEST)

    # Set the retest as completed
    projectretest.is_completed = True
    projectretest.is_active = False  # A completed retest is no longer active
    projectretest.save()
    
    # Get the updated project status after the retest update
    project = projectretest.project
    
    send_completion_retest_email_async.delay(projectretest.id)
    logger.info("Retest completion email notification queued for retest ID %s", safe_pk)
    
    return Response({
        'message': f'Retest {safe_pk} marked as completed',
        'project_status': project.status
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def markProjectRetestHold(request, pk):
    try:
        projectretest = ProjectRetest.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Set the retest as on hold (inactive but not completed)
    reason_for_hold = request.data.get('reason_for_hold', '')
    projectretest.is_active = False
    projectretest.is_completed = False
    projectretest.save()
    projectretest.project.status = 'On Hold'
    projectretest.project.hold_reason = reason_for_hold
    projectretest.project.save()
    
    # Get the updated project status after the retest update
    project = projectretest.project
    send_hold_retest_email_async.delay(projectretest.id)
    
    return Response({
        'message': f'Retest {pk} marked as on hold',
        'project_status': project.status
    })