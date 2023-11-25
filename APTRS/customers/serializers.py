from rest_framework import serializers
from .models import Company,Customer
from django.core.exceptions import ObjectDoesNotExist

class CompanySerializer(serializers.ModelSerializer):
    img = serializers.ImageField(required=False)
    class Meta:
        model = Company
        fields = '__all__'



class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

    def to_representation(self, instance):
        rep = super(CustomerSerializer, self).to_representation(instance)
        rep['company'] = instance.company.name
        return rep
    


  