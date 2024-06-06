from rest_framework import generics
from .models import ReportStandard, ProjectType
from .serializers import ReportStandardSerializer, ProjectTypeSerializer

class ReportStandardCreateView(generics.CreateAPIView):
    queryset = ReportStandard.objects.all()
    serializer_class = ReportStandardSerializer

class ReportStandardListView(generics.ListAPIView):
    queryset = ReportStandard.objects.all()
    serializer_class = ReportStandardSerializer



class ProjectTypeCreateView(generics.CreateAPIView):
    queryset = ProjectType.objects.all()
    serializer_class = ProjectTypeSerializer

class ProjectTypeListView(generics.ListAPIView):
    queryset = ProjectType.objects.all()
    serializer_class = ProjectTypeSerializer
