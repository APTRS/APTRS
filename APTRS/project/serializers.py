from rest_framework import serializers

from accounts.models import CustomUser
from customers.models import Company
from .models import (PrjectScope, Project, ProjectRetest, Vulnerability,
                     Vulnerableinstance)


class ImageSerializer(serializers.Serializer):
    images = serializers.ListField(child=serializers.ImageField(allow_empty_file=False),allow_empty=False)

class Projectserializers(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    owner = serializers.CharField(write_only=True)
    companyname = serializers.CharField(write_only=True)

    class Meta:
        model = Project
        fields = ('id','name', 'description', 'projecttype', 'startdate','enddate','testingtype','projectexception','status','owner','companyname')

    def to_representation(self, instance):
        rep = super(Projectserializers, self).to_representation(instance)
        rep['companyname'] = instance.companyname.name
        if 'owner' not in rep:
            rep['owner'] = instance.owner.username

        return rep


    def create(self, validated_data):
        # Access the request object from the context
        request = self.context.get('request')

        company_name = validated_data.pop('companyname', None)
        if company_name:
            try:
                company = Company.objects.get(name=company_name)
                validated_data['companyname'] = company
            except Company.DoesNotExist:
                raise serializers.ValidationError("Company with provided name does not exist")

        if request and request.user:
            if request.user.is_superuser:  # If request user is an admin
                if 'owner' in validated_data:
                    ownerusername = validated_data.pop('owner')
                    try:
                        user = CustomUser.objects.get(username=ownerusername)
                        if not user.is_active:
                            raise serializers.ValidationError("Owner is not an active user")
                    except CustomUser.DoesNotExist:
                        raise serializers.ValidationError("Owner with provided name does not exist")
                    validated_data['owner'] = user
                    project = Project.objects.create(**validated_data)
                    return project
                else:
                    raise serializers.ValidationError("owner field is missing")
            else:  # If request user is not an admin
                validated_data['owner'] = request.user.username
                project = Project.objects.create(**validated_data)
                return project
        else:
            raise serializers.ValidationError("Invalid request")

    def update(self, instance, validated_data):
        request = self.context.get('request')

        validated_data.pop('companyname', None)
        if request and request.user:
            if request.user.is_superuser:
                if 'owner' in validated_data:
                    ownerusername = validated_data.pop('owner')
                    try:
                        user = CustomUser.objects.get(username=ownerusername)
                        if not user.is_active:
                            raise serializers.ValidationError("Owner is not an active user")
                    except CustomUser.DoesNotExist:
                        raise serializers.ValidationError("Owner with provided name does not exist")
                    validated_data['owner'] = user

                else:
                    raise serializers.ValidationError("owner field is missing")
            else:  # If request user is not an admin
                validated_data['owner'] = request.user.username

        else:
            raise serializers.ValidationError("Invalid request")

        return super().update(instance, validated_data)


class Retestserializers(serializers.ModelSerializer):
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
