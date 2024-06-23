from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from utils.permissions import custom_permission_required
from .models import ReportStandard, ProjectType
from .serializers import ReportStandardSerializer, ProjectTypeSerializer

class ReportStandardCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    @custom_permission_required(['Manage Configurations'])

    def post(self, request):
        serializer = ReportStandardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReportStandardListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        queryset = ReportStandard.objects.all()
        serializer = ReportStandardSerializer(queryset, many=True)
        return Response(serializer.data)

class ProjectTypeCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    @custom_permission_required(['Manage Configurations'])

    def post(self, request):
        serializer = ProjectTypeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectTypeListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        queryset = ProjectType.objects.all()
        serializer = ProjectTypeSerializer(queryset, many=True)
        return Response(serializer.data)
