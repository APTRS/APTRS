from rest_framework import generics
from .models import ReportStandard
from .serializers import ReportStandardSerializer

class ReportStandardCreateView(generics.CreateAPIView):
    queryset = ReportStandard.objects.all()
    serializer_class = ReportStandardSerializer

class ReportStandardListView(generics.ListAPIView):
    queryset = ReportStandard.objects.all()
    serializer_class = ReportStandardSerializer
