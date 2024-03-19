import logging

import bleach
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status, views
from rest_framework.decorators import (api_view, permission_classes)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
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
        project = Project.objects.get(pk=pk)
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
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = Projectserializers(project,many=False)
    return Response(serializer.data)






class GetAllProjects(views.APIView):
    permission_classes = [IsAuthenticated]
    @custom_permission_required(['View All Projects'])
    def get(self, request):
        #projects = Project.objects.all()
        projects = Project.objects.select_related('companyname','owner').all()
        serializer = Projectserializers(projects, many=True)
        return Response(serializer.data)

class GetMyProjects(views.APIView):
    permission_classes = [IsAuthenticated]
    @custom_permission_required(['View All Projects'])
    def get(self, request):
        user = request.user  # Get the requesting user
        projects = Project.objects.filter(owner=user, status__in=['Upcoming', 'In Progress', 'Delay'])
        serializer = Projectserializers(projects, many=True)
        return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View All Projects'])
def getallproject_filter(request):
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
        project = Project.objects.get(pk=pk)

        #Checking if project has any vulnerabilities added
        has_vulnerabilities = Vulnerability.objects.filter(project=project).exists()
        if not has_vulnerabilities:
            logger.error("Project has no vulnerabilities, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no vulnerabilities, Kindly add vulnerabilities to generate project"})

        has_scope = PrjectScope.objects.filter(project=project).exists()
        if not has_scope:
            logger.error("Project has no Sccope added, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no Sccope added, Kindly add Scope to generate project"})

        for vulnerability in project.vulnerability_set.all():
            if vulnerability.instances.count() == 0:
                logger.error("Vulnerability %s has no Instance added", vulnerability.vulnerabilityname)
                response_data = {"Status": "Failed", "Message": f"Vulnerability {vulnerability.vulnerabilityname} has no Instance added, Kindly add Instance to generate project"}
                return Response(response_data)

        if request.data.get('Format') in ['pdf', 'html', 'excel','docx']:
            Report_format = request.data.get('Format')
        else:
            logger.error("Report Format is incorrect Only pdf and html is supported")
            return Response({"Status": "Failed", "Message": "Report Format is incorrect Only pdf and html is supported"})



        if request.data.get('Type') == 'Audit':
            Report_type = request.data.get('Type')
        elif request.data.get('Type') == 'Re-Audit':
            if ProjectRetest.objects.filter(project=project).exists():
                Report_type = request.data.get('Type')
            else:
                logger.error("Project Has no Retest generate ReAudit Report")
                return Response({"Status": "Failed", "Message": "Project Has no Retest generate ReAudit Report"})
        else:
            logger.error("Report Type is incorrect Only Audit or Re-Audit are supported")
            return Response({"Status": "Failed", "Message": "Report Type is incorrect Only Audit or Re-Audit are supported"})

        url = request.build_absolute_uri()
        standard = request.data.get('Standard')
        output = CheckReport(Report_format,Report_type,pk,url,standard,request)
        return output

    except ObjectDoesNotExist:
        logger.error("Project Not Found, Project: %s is incorrect", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
