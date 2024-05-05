import logging

import bleach
from django.core.exceptions import ObjectDoesNotExist
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework import status, views
from rest_framework.decorators import (api_view, permission_classes)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from utils.filters import (ProjectFilter,
                           paginate_queryset)
from utils.permissions import custom_permission_required

from ..models import (PrjectScope, Project, ProjectRetest, Vulnerability)
from ..report import CheckReport
from ..serializers import (Projectserializers)

logger = logging.getLogger(__name__)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Create new Projects'])
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
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Projects'])
def project_edit(request, pk):
    try:
        #project = Project.objects.get(pk=pk)
        project = Project.objects.select_related('companyname', 'owner').get(pk=pk)
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Specific Project'])
def getproject(request,pk):
    try:
        #project = Project.objects.get(pk=pk)
        project = Project.objects.select_related('companyname', 'owner').get(pk=pk)

    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = Projectserializers(project,many=False)
    return Response(serializer.data)






class GetAllProjects(views.APIView):
    permission_classes = [IsAuthenticated]
    @custom_permission_required(['View All Projects'])
    @method_decorator(cache_page(60 * 60 * 2))
    def get(self, request):
        #projects = Project.objects.all()
        projects = Project.objects.select_related('companyname','owner').all()
        serializer = Projectserializers(projects, many=True)
        return Response(serializer.data)



class GetMyProjects(views.APIView):
    permission_classes = [IsAuthenticated]
    @custom_permission_required(['View All Projects'])
    def get(self, request):
        projects = Project.objects.filter(
            Q(owner=request.user) & 
            Q(status__in=['Upcoming', 'In Progress', 'Delay'])
        ).select_related('companyname', 'owner').prefetch_related('related_model1', 'related_model2')
        
        serializer = Projectserializers(projects, many=True)
        return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View All Projects'])
def getallproject_filter(request):
    '''
    cache_key = 'all_projects_data'
    queryset = cache.get(cache_key)

    if not queryset:
        projects = Project.objects.all()#.select_related('companyname', 'owner')
        project_filter = ProjectFilter(request.GET, queryset=projects)
        filtered_queryset = project_filter.qs
        cache.set(cache_key, filtered_queryset)
    else:
        filtered_queryset = queryset
    '''
    projects = Project.objects.all()

    project_filter = ProjectFilter(request.GET, queryset=projects)
    filtered_queryset = project_filter.qs
    paginator, paginated_queryset = paginate_queryset(filtered_queryset, request)
    serializer = Projectserializers(paginated_queryset, many=True)

    return paginator.get_paginated_response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Projects'])
def deleteproject(request):
    projects = Project.objects.filter(id__in=request.data)
    projects.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Change Project Status to Complete'])
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



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Report Access'])
def project_report(request, pk):
    try:
        #project = Project.objects.get(pk=pk)
        project = Project.objects.select_related('companyname', 'owner').get(pk=pk)


        #Checking if project has any vulnerabilities added
        #has_vulnerabilities = Vulnerability.objects.filter(project=project).exists()
        vulnerabilities = project.vulnerability_set.all()
        if not vulnerabilities:
            logger.error("Project has no vulnerabilities, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no vulnerabilities, Kindly add vulnerabilities to generate project"})

        #has_scope = PrjectScope.objects.filter(project=project).exists()
        if not project.prjectscope_set.exists():
            logger.error("Project has no Sccope added, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no Sccope added, Kindly add Scope to generate project"})

        #for vulnerability in project.vulnerability_set.all():
        for vulnerability in vulnerabilities:
            if vulnerability.instances.count() == 0:
                logger.error("Vulnerability %s has no Instance added", vulnerability.vulnerabilityname)
                response_data = {"Status": "Failed", "Message": f"Vulnerability {vulnerability.vulnerabilityname} has no Instance added, Kindly add Instance to generate project"}
                return Response(response_data)

        if request.data.get('Format') in ['pdf', 'html', 'excel','docx']:
            Report_format = request.data.get('Format')
        else:
            logger.error("Report Format is incorrect Only pdf and html is supported")
            return Response({"Status": "Failed", "Message": "Report Format is incorrect Only pdf and html is supported"})


        # Validating report type
        report_type = request.data.get('Type', '')
        if report_type not in ['Audit', 'Re-Audit']:
            logger.error("Report type is incorrect. Only Audit or Re-Audit are supported")
            return Response({"Status": "Failed", "Message": "Report type is incorrect. Only Audit or Re-Audit are supported"}, status=status.HTTP_400_BAD_REQUEST)

        # Checking if Re-Audit report type is requested and if project has retests
        if report_type == 'Re-Audit' and not ProjectRetest.objects.filter(project=project).exists():
            logger.error("Project %s has no retests. Generate Re-Audit report", pk)
            return Response({"Status": "Failed", "Message": "Project has no retests. Generate Re-Audit report"}, status=status.HTTP_400_BAD_REQUEST)

        url = request.build_absolute_uri()
        standard = request.data.get('Standard')
        output = CheckReport(Report_format,report_type,pk,url,standard,request)
        return output

    except ObjectDoesNotExist:
        logger.error("Project Not Found, Project: %s is incorrect", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
