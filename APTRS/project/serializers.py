from rest_framework import serializers

from accounts.models import CustomUser
from customers.models import Company
from .models import (PrjectScope, Project, ProjectRetest, Vulnerability,
                     Vulnerableinstance)


class ImageSerializer(serializers.Serializer):
    #upload = serializers.ListField(child=serializers.ImageField(allow_empty_file=False),allow_empty=False)
    upload = serializers.ImageField(allow_empty_file=False)

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
    
    def get_user_permissions(self, user):
        # Fetching permissions associated with user's groups
        user_groups = user.groups.all()
        permissions = set()
        for group in user_groups:
            permissions |= set(group.list_of_permissions.all().values_list('name', flat=True))
        
        return permissions
    
    


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
            if request.user.is_superuser or 'Assign Projects' in self.get_user_permissions(request.user):  # If request user is an admin
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
            if request.user.is_superuser or 'Assign Projects' in self.get_user_permissions(request.user):
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


class UpdateProjectOwnerSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    owner = serializers.CharField(max_length=150, required=True)

    def validate_owner(self, value):
        try:
            user = CustomUser.objects.get(username=value)
            if not user.is_active:
                raise serializers.ValidationError("Owner is not an active user")
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Owner with provided username does not exist")

        return value

    def update_project(self, validated_data):
        id = validated_data.get('id')
        owner_username = validated_data.get('owner')

        try:
            project = Project.objects.get(id=id)
            user = CustomUser.objects.get(username=owner_username)
            if not user.is_active:
                raise serializers.ValidationError("Owner is not an active user")
            
            project.owner = user
            project.save()
            
        except Project.DoesNotExist:
            raise serializers.ValidationError("Project with provided ID does not exist")

        return project


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




class Instanceserializers(serializers.ModelSerializer):

    class Meta:
        model = Vulnerableinstance
        #fields = '__all__'
        fields = ('id','URL', 'Parameter', 'status')

class Vulnerabilityserializers(serializers.ModelSerializer):

    class Meta:
        model = Vulnerability
        fields = [
            'id',
            'vulnerabilityname',
            'vulnerabilityseverity',
            'cvssscore',
            'cvssvector',
            'status',
            'vulnerabilitydescription',
            'POC',
            'created',
            'vulnerabilitysolution',
            'vulnerabilityreferlnk',
            'project',
            'created_by',
            'last_updated_by'
            
        ]
        read_only_fields = ['status', 'created_by', 'last_updated_by']

    def create(self, validated_data):
        request = self.context.get("request")
        validated_data['created_by'] = request.user
        validated_data['last_updated_by'] = request.user
        return super(Vulnerabilityserializers, self).create(validated_data)
    
    def update(self, instance, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        validated_data['last_updated_by'] = request.user
        return super().update(instance, validated_data)

    


class VulnerableinstanceSerializerNessus(serializers.ModelSerializer):
    vulnerabilityid = serializers.PrimaryKeyRelatedField(queryset=Vulnerability.objects.all())
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Vulnerableinstance
        fields = '__all__'
