from rest_framework import serializers
from .models import Project, ProjectRetest,Vulnerability,Vulnerableinstance,PrjectScope
from django.contrib.auth.models import User


class ImageSerializer(serializers.Serializer):
    images = serializers.ListField(child=serializers.ImageField(allow_empty_file=False),allow_empty=False)
    
class Projectserializers(serializers.ModelSerializer):
    
    class Meta:
        model = Project
        fields = '__all__'

    def to_representation(self, instance):
        rep = super(Projectserializers, self).to_representation(instance)
        rep['companyname'] = instance.companyname.name
        return rep



class Retestserializers(serializers.ModelSerializer):
    #owner = serializers.ReadOnlyField()
    owner = serializers.PrimaryKeyRelatedField(read_only=True, default=serializers.CurrentUserDefault())
    class Meta:
        model = ProjectRetest
        fields = '__all__'

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data['owner'] = request.user
        return super(Retestserializers, self).create(validated_data)


class PrjectScopeserializers(serializers.ModelSerializer):
    class Meta:
        model = PrjectScope
        fields = ('id','scope', 'description')


class Vulnerabilityserializers(serializers.ModelSerializer):
    class Meta:
        model = Vulnerability
        fields = '__all__'
        read_only_fields = ['status']
      


class Instanceserializers(serializers.ModelSerializer):

    
    class Meta:
        model = Vulnerableinstance
        #fields = '__all__'
        fields = ('id','URL', 'Paramter', 'status')


class VulnerableinstanceSerializer3(serializers.ModelSerializer):
    vulnerabilityid = serializers.PrimaryKeyRelatedField(queryset=Vulnerability.objects.all())
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Vulnerableinstance
        fields = '__all__'





class VulnerableinstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vulnerableinstance
        fields = ('id','URL', 'Paramter','status')


class VulnerabilitySerializer2(serializers.ModelSerializer):
    
    class Meta:
        model = Vulnerability
        fields = ('id','project', 'vulnerabilityname', 'vulnerabilityseverity', 'cvssscore', 'cvssvector', 'status', 'vulnerabilitydescription', 'POC', 'vulnerabilitysolution', 'vulnerabilityreferlnk')#, 'instance')

