
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import CustomUser, CustomGroup,CustomPermission




class CustomPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomPermission
        fields = ['id', 'name', 'description']

class CustomGroupSerializer(serializers.ModelSerializer):
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
        permissions_names = validated_data.pop('list_of_permissions', [])  # Extract permission names
        group = CustomGroup.objects.create(**validated_data)
        self._handle_permissions(group, permissions_names)
        return group

    def update(self, instance, validated_data):
        permissions_names = validated_data.pop('list_of_permissions', [])  # Extract permission names
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
            except CustomPermission.DoesNotExist:
                raise serializers.ValidationError(f"Permission with name '{permission_name}' does not exist.")
        group.list_of_permissions.set(permissions)




class ChangePasswordSerializer(serializers.Serializer):
    oldpassword = serializers.CharField(write_only=True, required=True)
    newpassword = serializers.CharField(write_only=True, required=True)
    

    def validate(self, data):
        user = self.context['request'].user
        oldpassword = data.get('oldpassword')
        newpassword = data.get('newpassword')
        

        if not user.check_password(oldpassword):
            raise serializers.ValidationError("Current password does not match")
        else:
            user.set_password(newpassword)
            user.save()
            return data

class CustomGroupRelatedField(serializers.RelatedField):
    def to_representation(self, value):
        return value.name  # Returns group name in response

    def to_internal_value(self, data):
        try:
            group = CustomGroup.objects.get(name=data)
            return group  # Returns group object based on name
        except CustomGroup.DoesNotExist:
            raise serializers.ValidationError(f"Group with name '{data}' does not exist.")



class ProfileUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'full_name', 'profilepic', 'number']
        read_only_fields = ['date_joined', 'is_staff', 'email', 'groups', 'position', 'is_active','username']

    #def update(self, instance, validated_data):
        #instance.profilepic = validated_data.get('profilepic', instance.profilepic)
     #   instance.save()
      #  return instance



class CustomUserSerializer(serializers.ModelSerializer):
    profilepic = serializers.ImageField(required=False)  # Profile pic is optional
    groups = CustomGroupRelatedField(many=True, queryset=CustomGroup.objects.all())
    password = serializers.CharField(write_only=True, required=False)


    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'full_name', 'email', 'is_staff', 'is_active', 'is_superuser','profilepic', 'number', 'position', 'groups','password']
        read_only_fields = ['date_joined','is_staff']  

    def create(self, validated_data):

        # Set is_staff to True by default for new user
        validated_data['is_staff'] = True
        groups_data = validated_data.pop('groups', [])  # Extract groups 
        if 'password' not in validated_data:
            raise serializers.ValidationError("Password is required for creating a new user.")
        password = validated_data.pop('password')
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)  
        user.save()

        # Assign groups using set method
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
                # Hash the password before saving
                validated_data['password'] = make_password(validated_data['password'])
                


        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if 'password' in data:
            del data['password']  # Remove password from the response
        return data