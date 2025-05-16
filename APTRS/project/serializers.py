from rest_framework import serializers
from django.utils import timezone
from django.core.exceptions import ValidationError
from accounts.models import CustomUser
from customers.models import Company
from .models import (PrjectScope, Project, ProjectRetest, Vulnerability,
                     Vulnerableinstance)
from utils.image_handler import embed_images_in_html

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
    standard = serializers.ListField(child=serializers.CharField(), required=False)  # Add the standard field
    hold_reason = serializers.CharField(read_only=True, allow_blank=True, required=False)
    testingtype = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'projecttype', 'startdate', 'enddate', 'testingtype', 'projectexception', 'status', 'owner', 'companyname', 'standard','hold_reason')

    def to_representation(self, instance):
        request = self.context.get('request')
        rep = super(Projectserializers, self).to_representation(instance)
        rep['companyname'] = instance.companyname.name
        rep['owner'] = [user.username for user in instance.owner.all()]
        rep['standard'] = instance.standard  # Ensure the standard field is included in the representation

        if request and not request.user.is_staff:
            rep['description'] = embed_images_in_html(rep['description'])
            rep['projectexception'] = embed_images_in_html(rep['projectexception'])
            
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
        validated_data['standard'] = validated_data.get('standard', [])  # Handle the standard field
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
        if 'standard' in validated_data:
            instance.standard = validated_data['standard']  # Update the standard field
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
    
    class Meta:
        model = ProjectRetest
        fields = ('id', 'project', 'startdate', 'enddate', 'is_active', 'is_completed', 'owner', 'created_at')
    
    def get_status(self, obj):
        """Calculate status from is_active and is_completed fields"""
        
        
        if obj.is_completed:
            return 'Completed'
        if not obj.is_active:
            return 'On Hold'
            
        # Calculate status based on dates
        current_date = timezone.now().date()
        if current_date < obj.startdate:
            return 'Upcoming'
        elif obj.startdate <= current_date <= obj.enddate:
            return 'In Progress'
        elif current_date > obj.enddate:
            return 'Delay'
        return 'Unknown'

    def validate(self, attrs):
        project = attrs.get('project')
        startdate = attrs.get('startdate')
        enddate = attrs.get('enddate')

        if enddate and startdate and enddate < startdate:
            raise serializers.ValidationError("End date cannot be earlier than start date.")

        # Check for existing active, non-completed retests
        existing_retests = ProjectRetest.objects.filter(
            project=project, 
            is_completed=False
        )
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
        
        # Set default values for new fields
        validated_data['is_active'] = True
        validated_data['is_completed'] = False

        if request and request.user:
            if request.user.is_superuser or 'Assign Projects' in self.get_user_permissions(request.user):
                if owners_usernames:
                    owners = []
                    for username in owners_usernames:
                        try:
                            user = CustomUser.objects.get(email=username)  # Changed from email to username
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
            else:  # If request user is not an admin or doesn't have assign permission
                project_retest = ProjectRetest.objects.create(**validated_data)
                project_retest.owner.set([request.user])
                return project_retest
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
    created_by = serializers.CharField(source='created_by.username', read_only=True)
    last_updated_by = serializers.CharField(source='last_updated_by.username', read_only=True)

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
            'cwe',
            'published'
        ]
        read_only_fields = ['status', 'created_by', 'last_updated_by','published']

    def to_representation(self, instance):
        request = self.context.get('request')
        rep = super(Vulnerabilityserializers, self).to_representation(instance)

        if request and not request.user.is_staff:
            rep['vulnerabilitydescription'] = embed_images_in_html(rep['vulnerabilitydescription'])
            rep['POC'] = embed_images_in_html(rep['POC'])
            rep['vulnerabilitysolution'] = embed_images_in_html(rep['vulnerabilitysolution'])
            rep['vulnerabilityreferlnk'] = embed_images_in_html(rep['vulnerabilityreferlnk'])

        return rep

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

class PublishVulnerabilitySerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of vulnerability IDs to publish or unpublish."
    )
    publish = serializers.BooleanField(
        help_text="Set to True to publish vulnerabilities, False to unpublish."
    )
