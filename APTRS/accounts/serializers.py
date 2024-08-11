
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import validate_password, ValidationError
from customers.models import Company
from .models import CustomUser, CustomGroup,CustomPermission




class CustomPermissionSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomPermission model to list all available permissions
    Adding or updating permissions is not allowed as permissions are used over views
    Adding or updating permissions will require changes to the views as well.
    """
    class Meta:
        model = CustomPermission
        fields = ['id', 'name', 'description']



class CustomGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for managing CustomGroup instances with associated permissions.

    Fields:
    - id: The unique identifier of the group.
    - name: The name of the group.
    - description: A brief description of the group.
    - list_of_permissions: A list of permission names associated with the group.

    Note:
    - The 'list_of_permissions' field is a SlugRelatedField, allowing assignment of permissions by name.

    Create:
    - When creating a new group, the associated permissions can be specified in the 'list_of_permissions' field.

    Update:
    - To update a group, provide the new values for 'name', 'description', and 'list_of_permissions'.

    Usage:
    - This serializer is typically used in views or API endpoints for managing CustomGroup instances.
    """
    list_of_permissions = serializers.SlugRelatedField(
        many=True,
        queryset=CustomPermission.objects.all(),
        slug_field='name',
        required=False
    )

    class Meta:
        model = CustomGroup
        fields = ['id', 'name', 'description', 'list_of_permissions']
        extra_kwargs = {
            'name': {'required': False}
        }

    def create(self, validated_data):
        permissions_names = validated_data.pop('list_of_permissions', [])# Extract permission names
        group = CustomGroup.objects.create(**validated_data)
        self._handle_permissions(group, permissions_names)
        return group

    def update(self, instance, validated_data):
        permissions_names = validated_data.pop('list_of_permissions', [])# Extract permission names
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        self._handle_permissions(instance, permissions_names)
        return instance

    def _handle_permissions(self, group, permission_names):
        permissions = []
        for permission_name in permission_names:
            try:
                permission = CustomPermission.objects.get(name=permission_name)
                permissions.append(permission)
            except CustomPermission.DoesNotExist as exc:
                raise serializers.ValidationError(
                        f"Permission with name '{permission_name}' does not exist."
                        ) from exc
        group.list_of_permissions.set(permissions)



class ChangePasswordSerializer(serializers.ModelSerializer):
    """
    Serializer for changing a user's password.

    Fields:
    - oldpassword: The user's current password.
    - newpassword: The new password to be set.

    Validation:
    - Checks if the provided 'oldpassword' matches the user's current password.
    - Validates the 'newpassword' using Django's password validators.

    Update:
    - Updates the user's password with the new one.

    Usage:
    - This serializer is typically used in a view or API endpoint to handle password change requests.
    """

    oldpassword = serializers.CharField(write_only=True, required=True)
    newpassword = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ['oldpassword', 'newpassword']

    def validate(self, data):
        user = self.context['request'].user
        oldpassword = data.get('oldpassword')
        newpassword = data.get('newpassword')


        if not user.check_password(oldpassword):
            raise serializers.ValidationError("Current password does not match")
        try:
            validate_password(newpassword)
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})

        return data


class CustomGroupRelatedField(serializers.RelatedField):
    """
    Custom serializer field for handling CustomGroup instances.

    This field is designed to work with CustomGroup instances in serializers, allowing you to
    represent and validate group information based on group names.

    Methods:
    - to_representation: Converts a CustomGroup instance to its name for response representation.
    - to_internal_value: Converts a group name to the corresponding CustomGroup instance.

    Note:
    - This field can be used in serializers to represent and validate CustomGroup instances based on group names.
    - If a group with the specified name does not exist, a serializers.ValidationError is raised.
    """
    def to_representation(self, value):
        return value.name  # Returns group name in response

    def to_internal_value(self, data):
        try:
            group = CustomGroup.objects.get(name=data)
            return group  # Returns group object based on name
        except CustomGroup.DoesNotExist as exc:
            raise serializers.ValidationError(f"Group with name '{data}' does not exist.") from exc



class ProfileUserSerializer(serializers.ModelSerializer):
    """
    Serializer for representing user profiles with limited information.

    This serializer is designed to represent user profiles with a subset of fields.
    It is created to allow any users to edit their own profile information.

    Attributes:
    - id (int): The unique identifier of the user.
    - full_name (str): The full name of the user.
    - profilepic (str): The URL or path to the user's profile picture.
    - number (str): The contact number of the user.

    Read-only Attributes:
    - date_joined (datetime): The date and time when the user joined.
    - is_staff (bool): Indicates whether the user has staff privileges.
    - email (str): The email address of the user.
    - groups (list): The groups to which the user belongs.
    - position (str): The position or role of the user.
    - is_active (bool): Indicates whether the user account is active.
    - username (str): The username of the user.

    Note:
    - This serializer is suitable for providing a condensed view of user information in certain scenarios.
    - Read only fields are there so user cannot edit information like email or username etc as only admin or user with edit users permission can do it.
    """
    class Meta:
        model = CustomUser
        fields = ['id', 'full_name', 'profilepic', 'number']
        read_only_fields = ['date_joined', 'is_staff', 'email',
                            'groups', 'position', 'is_active','username']


class CustomUserSerializer(serializers.ModelSerializer):
    """
    Serializer for representing custom user objects.

    This serializer is designed to handle the serialization and deserialization
    of CustomUser objects. It includes fields such as username, full_name, email,
    profilepic, number, position, groups, and password.

    Attributes:
    - id (int): The unique identifier of the user.
    - username (str): The username of the user.
    - full_name (str): The full name of the user.
    - email (str): The email address of the user.
    - is_staff (bool): Indicates whether the user has staff privileges.
    - is_active (bool): Indicates whether the user account is active.
    - is_superuser (bool): Indicates whether the user has superuser privileges.
    - profilepic (image): The user's profile picture.
    - number (str): The contact number of the user.
    - position (str): The position or role of the user.
    - groups (list): The groups to which the user belongs.
    - password (str): The user's password. (write-only)

    Read-only Attributes:
    - date_joined (datetime): The date and time when the user joined.

    Note:
    - The 'groups' field is handled by CustomGroupRelatedField.
    - Password is a write-only field and not included in the response.
    """
    profilepic = serializers.ImageField(required=False)  # Profile pic is optional
    groups = CustomGroupRelatedField(many=True, queryset=CustomGroup.objects.all())
    password = serializers.CharField(write_only=True, required=False)


    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'full_name', 'email', 'is_staff', 'is_active',
                  'is_superuser','profilepic', 'number', 'position', 'groups','password']
        read_only_fields = ['date_joined','is_staff']

    def create(self, validated_data):

        # Set is_staff to True by default for new user
        validated_data['is_staff'] = True
        groups_data = validated_data.pop('groups', [])#Extract groups
        if 'password' not in validated_data:
            raise serializers.ValidationError("Password is required for creating a new user.")
        password = validated_data.pop('password')
        try:
            validate_password(password)
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        company = Company.objects.filter(internal=True).first()
        user.company = company
        user.save()
        user.groups.set(groups_data)

        return user

    def update(self, instance, validated_data):
        # Set is_staff to True during update
        validated_data['is_staff'] = True

        if 'password' in validated_data:
            if not validated_data['password']:
                # If password is empty, remove it from validated_data
                validated_data.pop('password')
            else:
                password = validated_data['password']
                try:
                    validate_password(password)
                except ValidationError as e:
                    raise serializers.ValidationError({"password": e.messages})
                # Hash the password before saving
                validated_data['password'] = make_password(password)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'password' in data:
            del data['password']# Remove password from the response
        return data
