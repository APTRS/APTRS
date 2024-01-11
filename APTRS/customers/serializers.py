from rest_framework import serializers
from .models import Company
from accounts.models import CustomUser, CustomGroup
from django.contrib.auth.hashers import make_password

class CompanySerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False)
    class Meta:
        model = Company
        fields = '__all__'

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
            except Company.DoesNotExist:
                raise serializers.ValidationError("Company with provided name does not exist")

        # Set is_staff to True by default for new user
        validated_data['is_staff'] = False
        
        if 'password' not in validated_data:
            raise serializers.ValidationError("Password is required for creating a new user.")
        password = validated_data.pop('password')
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
                # Hash the password before saving
                validated_data['password'] = make_password(validated_data['password'])


        return super().update(instance, validated_data)


  