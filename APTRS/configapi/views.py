from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from utils.permissions import custom_permission_required
from .models import ReportStandard, ProjectType
from .serializers import ReportStandardSerializer, ProjectTypeSerializer

REPORT_STANDARD_LIST_CACHE_KEY = "report_standard_list"
PROJECT_TYPE_LIST_CACHE_KEY = "project_type_list"

class ReportStandardCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    @custom_permission_required(['Manage Configurations'])

    def post(self, request):
        serializer = ReportStandardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.delete(REPORT_STANDARD_LIST_CACHE_KEY)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReportStandardListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):

        cached_data = cache.get(REPORT_STANDARD_LIST_CACHE_KEY)
        if cached_data:
            return Response(cached_data)

        queryset = ReportStandard.objects.all()
        serializer = ReportStandardSerializer(queryset, many=True)
        cache.set(REPORT_STANDARD_LIST_CACHE_KEY, serializer.data, 3600)
        return Response(serializer.data)

class ProjectTypeCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    @custom_permission_required(['Manage Configurations'])

    def post(self, request):
        serializer = ProjectTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.delete(PROJECT_TYPE_LIST_CACHE_KEY)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectTypeListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    @method_decorator(cache_page(3600))
    def get(self, request):

        cached_data = cache.get(PROJECT_TYPE_LIST_CACHE_KEY)
        if cached_data:
            return Response(cached_data)

        queryset = ProjectType.objects.all()
        serializer = ProjectTypeSerializer(queryset, many=True)
        cache.set(PROJECT_TYPE_LIST_CACHE_KEY, serializer.data, 3600)
        return Response(serializer.data)

@api_view(['GET'])
def ping(request):
    return Response({'status': 'ok', 'message': 'Server is up and running!'}, status=status.HTTP_200_OK)
