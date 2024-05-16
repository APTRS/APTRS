from rest_framework import serializers
from .models import ReportStandard

class ReportStandardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportStandard
        fields = ['id', 'name']