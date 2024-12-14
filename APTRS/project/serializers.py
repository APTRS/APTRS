from rest_framework import serializers
from django.core.exceptions import ValidationError
from accounts.models import CustomUser
from customers.models import Company
from .models import (PrjectScope, Project, ProjectRetest, Vulnerability,
                     Vulnerableinstance)


def validate_file_extension(value):
    allowed_extensions = ['jpg', 'jpeg', 'png']
    extension = value.name.split('.')[-1]
    if extension not in allowed_extensions:
        raise ValidationError(f'Invalid file type: {extension}. Only {", ".join(allowed_extensions)} are accepted.')


class ImageSerializer(serializers.Serializer):
    upload = serializers.ImageField(allow_empty_file=False,validators=[validate_file_extension])

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username']

class Projectserializers(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)
    owner = serializers.ListField(child=serializers.CharField(), write_only=True)
    companyname = serializers.CharField(write_only=True)

    class Meta:
        model = Project
        fields = ('id','name', 'description', 'projecttype', 'startdate','enddate','testingtype','projectexception','status','owner','companyname')

    def to_representation(self, instance):
        rep = super(Projectserializers, self).to_representation(instance)
        rep['companyname'] = instance.companyname.name
        rep['owner'] = [user.username for user in instance.owner.all()]

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
        owners_usernames = validated_data.pop('owner', [])
        company_name = validated_data.pop('companyname', None)
        if company_name:
            try:
                company = Company.objects.get(name=company_name)
                validated_data['companyname'] = company
            except Company.DoesNotExist:
                raise serializers.ValidationError("Company with provided name does not exist")



        if request and request.user:
            if request.user.is_superuser or 'Assign Projects' in self.get_user_permissions(request.user):  # If request user is an admin
                if owners_usernames:
                    owners = []
                    for username in owners_usernames:
                        try:
                            user = CustomUser.objects.get(username=username)
                            if not user.is_active:
                                raise serializers.ValidationError(f"Owner '{username}' is not an active user")
                            owners.append(user)
                        except CustomUser.DoesNotExist:
                            raise serializers.ValidationError(f"Owner '{username}' does not exist")

                    project = Project.objects.create(**validated_data)
                    project.owner.set(owners)
                    return project
                else:
                    raise serializers.ValidationError("owner field is missing")
            else:  # If request user is not an admin
                #validated_data['owner'] = [request.user]
                project = Project.objects.create(**validated_data)
                project.owner.set([request.user])

                return project
        else:
            raise serializers.ValidationError("Invalid request")

    def update(self, instance, validated_data):
        request = self.context.get('request')
        owners_usernames = validated_data.pop('owner', [])
        validated_data.pop('companyname', None)
        if request and request.user:
            if request.user.is_superuser or 'Assign Projects' in self.get_user_permissions(request.user):
                if owners_usernames:
                    owners = []
                    for username in owners_usernames:
                        try:
                            user = CustomUser.objects.get(username=username)
                            if not user.is_active:
                                raise serializers.ValidationError(f"Owner '{username}' is not an active user")
                            owners.append(user)
                        except CustomUser.DoesNotExist:
                            raise serializers.ValidationError(f"Owner '{username}' does not exist")
                    instance.owner.set(owners)  # Update many-to-many relationships
                else:
                    raise serializers.ValidationError("At least one owner is required")
            else:  # If request user is not an admin
                instance.owner.set([request.user])

        else:
            raise serializers.ValidationError("Invalid request")

        return super().update(instance, validated_data)


class UpdateProjectOwnerSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    owner = serializers.ListField(child=serializers.CharField(max_length=150), required=True)


    def validate_owner(self, value):
        # Ensure all provided usernames are valid and active
        users = []
        for username in value:
            try:
                user = CustomUser.objects.get(username=username)
                if not user.is_active:
                    raise serializers.ValidationError(f"Owner '{username}' is not an active user")
                users.append(user)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError(f"Owner with username '{username}' does not exist")

        return users

    def update_project(self, validated_data):
        project_id = validated_data.get('id')
        owners = validated_data.get('owner')

        try:
            project = Project.objects.get(id=project_id)
            project.owner.set(owners)  # Set the many-to-many relationship
            project.save()

        except Project.DoesNotExist:
            raise serializers.ValidationError("Project with provided ID does not exist")

        return project


class Retestserializers(serializers.ModelSerializer):
    owner = serializers.SlugRelatedField(
        slug_field='username',
        queryset=CustomUser.objects.all(),
        many=True

    )
    status = serializers.CharField(read_only=True)
    class Meta:
        model = ProjectRetest
        fields = ('id', 'project', 'startdate', 'enddate', 'status', 'owner')


    def validate(self, attrs):
        project = attrs.get('project')
        startdate = attrs.get('startdate')
        enddate = attrs.get('enddate')

        if enddate and startdate and enddate < startdate:
            raise serializers.ValidationError("End date cannot be earlier than start date.")

        # Check for existing non-completed retests
        existing_retests = ProjectRetest.objects.filter(project=project, status__in=['Upcoming', 'In Progress', 'Delay'])
        if self.instance:
            existing_retests = existing_retests.exclude(id=self.instance.id)

        if existing_retests.exists():
            raise serializers.ValidationError("Cannot create a new Project Retest. There is an existing retest task that hasn't been completed.")

        return attrs

    def get_user_permissions(self, user):
        user_groups = user.groups.all()
        permissions = set()
        for group in user_groups:
            permissions |= set(group.list_of_permissions.all().values_list('name', flat=True))
        return permissions

    def create(self, validated_data):
        request = self.context.get('request')
        owners_usernames = validated_data.pop('owner', [])

        if request and request.user:
            if request.user.is_superuser or 'Assign Projects' in self.get_user_permissions(request.user):
                if owners_usernames:
                    owners = []
                    for username in owners_usernames:
                        try:
                            user = CustomUser.objects.get(email=username)
                            if not user.is_active:
                                raise serializers.ValidationError(f"Owner '{username}' is not an active user")
                            owners.append(user)
                        except CustomUser.DoesNotExist:
                            raise serializers.ValidationError(f"Owner '{username}' does not exist")

                    project_retest = ProjectRetest.objects.create(**validated_data)
                    project_retest.owner.set(owners)
                    return project_retest
                else:
                    raise serializers.ValidationError("owner field is missing")
            else:  # If request user is not an admin o have assign permission
                validated_data['owner'] = [request.user]
                project = ProjectRetest.objects.create(**validated_data)
                return project
        else:
            raise serializers.ValidationError("Invalid request")

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
            'last_updated_by',
            'cwe'
        ]
        read_only_fields = ['status', 'created_by', 'last_updated_by']

    def create(self, validated_data):
        request = self.context.get("request")
        print(f"User: {request.user.id}")
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
