

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

from django.contrib.auth.models import User
from .models import Profile
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.functions import Lower
from phonenumber_field.modelfields import PhoneNumberField


class ProfileSerializer(serializers.ModelSerializer):
    profilepic = serializers.ImageField(required=False)
    number = PhoneNumberField(blank=False, null=False)

    class Meta:
        model = Profile
        fields = '__all__' #('user, profilepic', 'number', 'company')
    
    def create(self, validated_data):
        if not validated_data.get('number'):
            raise serializers.ValidationError({'number': 'This field is required.'})
        validated_data['company'] = settings.ORG
        validated_data['number'] = validated_data.get('number')
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data['company'] = settings.ORG
        return super().update(instance, validated_data)

        

class UserSerializer(serializers.ModelSerializer):
    #profile = ProfileSerializer()
    profile = ProfileSerializer(source='userprofile', required=False)
    is_superuser = serializers.ReadOnlyField()
    

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'profile']
        #read_only_fields = ['is_superuser']

    def validate(self, data):
        if 'is_superuser' in data:
            if self.context['request'].user.is_superuser:
                data['is_superuser'] = self.initial_data.get('is_superuser')
            else:
                return data
        else:
            return data
    
class AdminUserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(source='userprofile', required=False)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_active','password','profile']


    def validate_email(self, value):
        email = value.lower()
        queryset = User.objects.filter(email=email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise ValidationError('A user with that email already exists.')
        return email
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        #profile_data = validated_data.pop('userprofile', {})
        #profile_serializer = self.fields['profile']
        number = self.context['request'].data.get('number')
        validated_data['password'] = make_password(password)
        user = super().create(validated_data)

        profile = Profile.objects.create(user=user, number=number)
        user.userprofile = profile
        user.save()
        return user

    def update(self, instance, validated_data):
        password =  validated_data.pop('password')
        if password is not None:
            validated_data['password'] = make_password(password)
        else:
            validated_data['password'] = instance.password
        instance = super().update(instance, validated_data)
        profile = instance.userprofile
        profile.number = self.context['request'].data.get('number')
        profile.save()
        return instance
        #return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['message'] = 'User object created successfully.'
        data['status'] = 'true'
        del data['password']
        return data


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
