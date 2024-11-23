from accounts.models import CustomGroup, CustomUser
from django.contrib.auth.hashers import make_password
from django.contrib.auth.password_validation import (ValidationError,
                                                     validate_password)
from rest_framework import serializers
from django.conf import settings
from utils.s3_utils import generate_presigned_url
from .models import Company

class CompanySerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False)
    class Meta:
        model = Company
        fields = '__all__'

    def to_representation(self, instance):
        # Call the parent class's to_representation method to get the default representation
        representation = super().to_representation(instance)

        # Check if the image exists and update its URL
        if instance.img:
            request = self.context.get('request')
            img_url = instance.img.url

            if settings.USE_S3:
                # Generate a signed URL if using S3
                signed_url = generate_presigned_url(instance.img.name, response_content_type='image/jpeg')  # Adjust content type as needed
                representation['img'] = signed_url
            else:
                representation['img'] = request.build_absolute_uri(img_url)

        return representation


class CustomerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    company = serializers.CharField(write_only=True)
    class Meta:
        model = CustomUser
        fields = ['id', 'full_name', 'email', 'is_active', 'number', 'position','password','company']
        read_only_fields = ['date_joined','is_staff']

    def to_representation(self, instance):
        rep = super(CustomerSerializer, self).to_representation(instance)
        rep['company'] = instance.company.name
        return rep

    def create(self, validated_data):

        company_name = validated_data.pop('company', None)
        if company_name:
            try:
                company = Company.objects.get(name=company_name)
                validated_data['company'] = company
            except Company.DoesNotExist as exc:
                raise serializers.ValidationError("Company with provided name does not exist") from exc

        # Set is_staff to True by default for new user
        validated_data['is_staff'] = False

        if 'password' not in validated_data:
            raise serializers.ValidationError("Password is required for creating a new user.")
        password = validated_data.pop('password')
        try:
            # Validate the password
            validate_password(password)
        except ValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        user = CustomUser.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        customer_group, _ = CustomGroup.objects.get_or_create(name='Customer')
        user.groups.add(customer_group)


        return user


    def update(self, instance, validated_data):

        validated_data.pop('company', None)

        validated_data['is_staff'] = False

        if 'password' in validated_data:
            if not validated_data['password']:
                # If password is empty, remove it from validated_data
                validated_data.pop('password')
            else:
                password = validated_data['password']
                try:
                    # Validate the password
                    validate_password(password)
                except ValidationError as e:
                    raise serializers.ValidationError({"password": e.messages})
                # Hash the password before saving
                validated_data['password'] = make_password(password)


        return super().update(instance, validated_data)
