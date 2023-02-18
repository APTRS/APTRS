from rest_framework import serializers
from .models import Project, ProjectRetest,Vulnerability,Vulnerableinstance
from django.contrib.auth.models import User


class Projectserializers(serializers.ModelSerializer):
    
    class Meta:
        model = Project
        fields = '__all__'

    def to_representation(self, instance):
        rep = super(Projectserializers, self).to_representation(instance)
        rep['companyname'] = instance.companyname.name
        return rep



class Retestserializers(serializers.ModelSerializer):
    class Meta:
        model = ProjectRetest
        fields = '__all__'




class Vulnerabilityserializers(serializers.ModelSerializer):
    class Meta:
        model = Vulnerability
        fields = '__all__'


class Instanceserializers(serializers.ModelSerializer):
    class Meta:
        model = Vulnerableinstance
        fields = '__all__'



