from rest_framework.decorators import api_view, permission_classes
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from utils.permissions import custom_permission_required
from .models import ReportStandard, ProjectType
from .serializers import ReportStandardSerializer, ProjectTypeSerializer
from django.shortcuts import get_object_or_404

REPORT_STANDARD_LIST_CACHE_KEY = "report_standard_list"
PROJECT_TYPE_LIST_CACHE_KEY = "project_type_list"

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Configurations'])
def create_report_standard(request):
    serializer = ReportStandardSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        cache.delete(REPORT_STANDARD_LIST_CACHE_KEY)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def list_report_standards(request):
    cached_data = cache.get(REPORT_STANDARD_LIST_CACHE_KEY)
    if cached_data:
        return Response(cached_data)

    queryset = ReportStandard.objects.all()
    serializer = ReportStandardSerializer(queryset, many=True)
    cache.set(REPORT_STANDARD_LIST_CACHE_KEY, serializer.data, 3600)
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Configurations'])
def edit_report_standard(request, pk):
    report_standard = get_object_or_404(ReportStandard, pk=pk)
    serializer = ReportStandardSerializer(report_standard, data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        cache.delete(REPORT_STANDARD_LIST_CACHE_KEY)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Configurations'])
def delete_report_standard(request, pk):
    report_standard = get_object_or_404(ReportStandard, pk=pk)
    report_standard.delete()
    cache.delete(REPORT_STANDARD_LIST_CACHE_KEY)
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Configurations'])
def create_project_type(request):
    serializer = ProjectTypeSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        cache.delete(PROJECT_TYPE_LIST_CACHE_KEY)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
@cache_page(3600)
def list_project_types(request):
    cached_data = cache.get(PROJECT_TYPE_LIST_CACHE_KEY)
    if cached_data:
        return Response(cached_data)

    queryset = ProjectType.objects.all()
    serializer = ProjectTypeSerializer(queryset, many=True)
    cache.set(PROJECT_TYPE_LIST_CACHE_KEY, serializer.data, 3600)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Configurations'])
def edit_project_type(request, pk):
    project_type = get_object_or_404(ProjectType, pk=pk)
    serializer = ProjectTypeSerializer(project_type, data=request.data)
    
    if serializer.is_valid():
        serializer.save()
        cache.delete(PROJECT_TYPE_LIST_CACHE_KEY)
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Configurations'])
def delete_project_type(request, pk):
    project_type = get_object_or_404(ProjectType, pk=pk)
    project_type.delete()
    cache.delete(PROJECT_TYPE_LIST_CACHE_KEY)
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
def ping(request):
    return Response({'status': 'ok', 'message': 'Server is up and running!'}, status=status.HTTP_200_OK)
