from rest_framework import serializers
from .models import ReportStandard, ProjectType

class ReportStandardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportStandard
        fields = ['id', 'name']



class ProjectTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectType
        fields = ['id', 'name']