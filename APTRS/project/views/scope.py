import logging

from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from rest_framework.decorators import (api_view, permission_classes)
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from utils.permissions import custom_permission_required

from ..models import (PrjectScope, Project)
from ..serializers import PrjectScopeserializers

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def projectaddscope(request,pk):
    try:
        project = Project.objects.get(pk=pk)
        serializer = PrjectScopeserializers(data=request.data,many=True)
        if serializer.is_valid(raise_exception=True):
            serializer.save(project=project)
            return Response(serializer.data)
        else:
            logger.error("Serializer errors: %s", str(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def deleteprojectscope(request):
    projects = PrjectScope.objects.filter(id__in=request.data)
    projects.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Projects'])
def projectscopedit(request,pk):
    try:
        projectscope = PrjectScope.objects.get(pk=pk)
        serializer = PrjectScopeserializers(instance=projectscope,data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            respdata={'Status':"Success"}
            respdata.update(serializer.data)

            return Response(respdata)
        else:
            logger.error("Sccope are incorrect")
            return Response(serializer.errors, status=400)
    except ObjectDoesNotExist:
        logger.error("Scope Not Found, : %s is incorrect", pk)
        return Response({"message": "Scope not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def getprojectscopes(request,pk):
    try:
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    projectscope = PrjectScope.objects.filter(project=project)
    serializer = PrjectScopeserializers(projectscope,many=True)
    return Response(serializer.data)

