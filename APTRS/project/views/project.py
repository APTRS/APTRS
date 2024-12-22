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
from utils.filters import (ProjectFilter,
                           paginate_queryset)
from utils.permissions import custom_permission_required
from utils.validators import get_base_url
from ..models import (Project, ProjectRetest)
from ..report import CheckReport
from ..serializers import (Projectserializers, UpdateProjectOwnerSerializer)

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
@permission_classes([IsAuthenticated,IsAdminUser])
def getproject(request,pk):
    try:
        #project = Project.objects.get(pk=pk)
        project = Project.objects.prefetch_related('owner').select_related('companyname').get(pk=pk)

    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = Projectserializers(project,many=False)
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
        projects = Project.objects.filter(
            Q(owner=request.user) &
            Q(status__in=['Upcoming', 'In Progress', 'Delay'])
        )

        retest_exists = ProjectRetest.objects.filter(
            project=OuterRef('pk'),
            status__in=['Upcoming', 'In Progress', 'Delay'],
            owner=request.user,
        ).values('pk')

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

    # Set the project status to 'Completed'
    project.status = 'Completed'
    project.save()

    return Response({'message': f'Status of project {safe_pk} updated to Completed'})


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

    # Set the project status to 'Completed'
    project.status = 'In Progress'
    project.save()
    latest_status = project.calculate_status

    return Response({'message': f'Status of project {safe_pk} updated', 'latest_status': latest_status})



@api_view(['POST','GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def project_report(request, pk):
    try:
        #project = Project.objects.get(pk=pk)
        report_format = request.query_params.get('Format')
        project = Project.objects.prefetch_related('owner').select_related('companyname').get(pk=pk)
        report_type = request.query_params.get('Type')

        # Checking if Re-Audit report type is requested and if project has retests
        if report_type == 'Re-Audit' and not ProjectRetest.objects.filter(project=project).exists():
            logger.error("Project %s has no retests. Generate Re-Audit report", pk)
            return Response({"Status": "Failed", "Message": "Project has no retests. Generate Re-Audit report"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not report_format in ['pdf', 'excel','docx']:
            logger.error("Report Format is incorrect Only pdf, docx and excel are supported")
            return Response({"Status": "Failed", "Message": "Report Format is incorrect Only pdf, docx and excel are supported"})

        # Validating report type    
        if report_type not in ['Audit', 'Re-Audit']:
            logger.error("Report type is incorrect. Only Audit or Re-Audit are supported")
            return Response({"Status": "Failed", "Message": "Report type is incorrect. Only Audit or Re-Audit are supported"}, status=status.HTTP_400_BAD_REQUEST)
        
        #has_scope = PrjectScope.objects.filter(project=project).exists()
        if not project.prjectscope_set.exists():
            logger.error("Project has no Sccope added, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no Sccope added, Kindly add Scope to generate project"})

        #Checking if project has any vulnerabilities added
        #has_vulnerabilities = Vulnerability.objects.filter(project=project).exists()
        vulnerabilities = project.vulnerability_set.all()
        if not vulnerabilities:
            logger.error("Project has no vulnerabilities, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no vulnerabilities, Kindly add vulnerabilities to generate project"})

        

        #for vulnerability in project.vulnerability_set.all():
        for vulnerability in vulnerabilities:
            if vulnerability.instances.count() == 0:
                logger.error("Vulnerability %s has no Instance added", vulnerability.vulnerabilityname)
                response_data = {"Status": "Failed", "Message": f"Vulnerability {vulnerability.vulnerabilityname} has no Instance added, Kindly add Instance to generate project"}
                return Response(response_data)

    except Exception as e:
        logger.error(e)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    
    #url = request.build_absolute_uri()
    url = get_base_url(request)
    try:
        standard = request.query_params.getlist('Standard')
        if not standard:
            raise ValueError("No 'Standard' query parameter found.")
    except ValueError as e:
        logging.error(f"Error: {e}")
        return Response({"Status": "Failed", "Message": "Report Standards are not provided"})
    
    refresh = RefreshToken.for_user(request.user) # generate new token for user to access auth protected images for report, user token in request might be close to expiry, so refreshing it to have new 30 mins token
    access_token = refresh.access_token
    output = CheckReport(report_format,report_type,pk,url,standard,request,access_token)
    return output
