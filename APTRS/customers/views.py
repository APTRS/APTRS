from django.core.exceptions import ObjectDoesNotExist
from rest_framework import generics
from .serializers import CompanySerializer,CustomerSerializer
from rest_framework import views
from rest_framework.response import Response
from rest_framework import status    
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAdminUser,IsAuthenticated
from .models import Customer,Company
import logging
from accounts.permissions import custom_permission_required

logger = logging.getLogger(__name__)





@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View all Client Companies List'])
def getallcompnay(request):
    companyname = Company.objects.all()
    serializer = CompanySerializer(companyname,many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View all Customers List'])
def getallcustomer(request):
    customername = Customer.objects.all()
    serializer = CustomerSerializer(customername,many=True)
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View specific customer'])
def getcustomer(request,pk):
    try:
        customer = Customer.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Customer not found with pk=%s", pk)
        return Response({"message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = CustomerSerializer(customer,many=False)
    return Response(serializer.data)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit customer'])
def customeredit(request,pk):
    try:
        customer = Customer.objects.get(pk=pk)
        
    except ObjectDoesNotExist:
        logger.error("Customer not found with pk=%s", pk)
        return Response({"message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
    try:
        company = Company.objects.get(name=request.data.get('company'))
    except ObjectDoesNotExist:
        logger.error("Company not found with pk=%s", request.data.get('company'))
        return Response({"message": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

    request.data['company'] = company.id
    serializer = CustomerSerializer(instance=customer,data=request.data)
    if serializer.is_valid(raise_exception=True):
        
        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add customer'])
def customeradd(request):
    try:
        company = Company.objects.get(name=request.data.get('company'))
    except ObjectDoesNotExist:
        logger.error("Company not found with name=%s", request.data.get('company'))
        return Response({"message": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
    request.data['company'] = company.id
    serializer = CustomerSerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        return Response(serializer.data)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete customer'])
def customerdelete(request):
    customers = Customer.objects.filter(id__in=request.data)
    customers.delete()
    respdata={'Status':"Success"}
    return Response(respdata)





@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Get specific Client Company'])
def getcompany(request,pk):
    try:
        company = Company.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Company not found with pk=%s", pk)
        return Response({"message": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = CompanySerializer(company,many=False)
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add Company'])
def add_company(request):
    serializer = CompanySerializer(data=request.data)
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
       


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Company'])
def edit_company(request,pk):
    try:
        company = Company.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Company not found with pk=%s", pk)
        return Response({"message": "Company not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = CompanySerializer(instance=company,data=request.data, partial=True)
    if serializer.is_valid(raise_exception=True): 
        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Company'])
def companydelete(request):
    company = Company.objects.filter(id__in=request.data)
    company.delete()
    respdata={'Status':"Success"}
    return Response(respdata)