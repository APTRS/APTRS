# Django imprts
import logging

from accounts.models import CustomUser
from django.core.exceptions import ObjectDoesNotExist
from django.views.decorators.cache import cache_page
from rest_framework import status
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from utils.filters import CompanyFilter, UserFilter, paginate_queryset
from utils.permissions import custom_permission_required

#local imports
from .models import Company
from .serializers import CompanySerializer, CustomerSerializer

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def getallcompnay_filter(request):
    sort_order = request.GET.get('order_by', 'desc')
    sort_field = request.GET.get('sort', 'id') or 'id'

    cache_key = 'all_company_data'
    companyname = cache.get(cache_key)

    if not companyname:
        companyname = Company.objects.all()
        cache.set(cache_key, companyname, timeout=3600)

    companyname_filter = CompanyFilter(request.GET, queryset=companyname)
    filtered_queryset = companyname_filter.qs
    if sort_order == 'asc':
        filtered_queryset = filtered_queryset.order_by(sort_field)
    else:
        filtered_queryset = filtered_queryset.order_by('-'+sort_field)
    #filtered_queryset = companyname_filter.qs
    paginator, paginated_queryset = paginate_queryset(filtered_queryset, request)
    serializer = CompanySerializer(paginated_queryset, many=True,context={"request": request})

    return paginator.get_paginated_response(serializer.data)




@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def getallcompnay(request):
    cache_key = 'all_company_data'
    companyname = cache.get(cache_key)

    if not companyname:
        companyname = Company.objects.all()
        cache.set(cache_key, companyname, timeout=3600)
    serializer = CompanySerializer(companyname,many=True,context={"request": request})
    return Response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def getallcustomer_filter(request):
    sort_order = request.GET.get('order_by', 'desc')
    sort_field = request.GET.get('sort', 'id') or 'id'
    cache_key = 'all_customer_data'
    customername = cache.get(cache_key)

    if not customername:
        customername = CustomUser.objects.filter(is_staff=False, company__isnull=False)
        cache.set(cache_key, customername, timeout=3600)

    customername_filter = UserFilter(request.GET, queryset=customername)
    filtered_queryset = customername_filter.qs
    if sort_order == 'asc':
        filtered_queryset = filtered_queryset.order_by(sort_field)
    else:
        filtered_queryset = filtered_queryset.order_by('-'+sort_field)
    paginator, paginated_queryset = paginate_queryset(filtered_queryset, request)
    serializer = CustomerSerializer(paginated_queryset, many=True)

    return paginator.get_paginated_response(serializer.data)



@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def getallcustomer(request):
    cache_key = 'all_customer_data'
    customername = cache.get(cache_key)

    if not customername:
        customername = CustomUser.objects.filter(is_staff=False, company__isnull=False)
        cache.set(cache_key, customername, timeout=3600)
    serializer = CustomerSerializer(customername,many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Customer'])
def customeradd(request):
    serializer = CustomerSerializer(data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        cache.delete('all_customer_data')
        return Response(serializer.data)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Customer'])
def getcustomer(request,pk):
    try:
        customer = CustomUser.objects.get(pk=pk, is_staff=False)
    except ObjectDoesNotExist:
        logger.error("Customer not found with pk=%s", pk)
        return Response({"message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CustomerSerializer(customer,many=False)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Customer'])
def customerdelete(request):
    customers = CustomUser.objects.filter(id__in=request.data,is_staff=False)
    customers.delete()
    cache.delete('all_customer_data')
    respdata={'Status':"Success"}
    return Response(respdata)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Customer'])
def customeredit(request,pk):
    try:
        customer = CustomUser.objects.get(pk=pk,is_staff=False)

    except ObjectDoesNotExist:
        logger.error("Customer not found with pk=%s", pk)
        return Response({"message": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CustomerSerializer(instance=customer, data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):

        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)
        cache.delete('all_customer_data')
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Company'])
def getcompany(request,pk):
    try:
        company = Company.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Company not found with pk=%s", pk)
        return Response({"message": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CompanySerializer(company,many=False,context={"request": request})
    return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Company'])
def add_company(request):
    serializer = CompanySerializer(data=request.data,context={"request": request})
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)
        cache.delete('all_company_data')
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Company'])
def edit_company(request,pk):
    try:
        company = Company.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Company not found with pk=%s", pk)
        return Response({"message": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CompanySerializer(instance=company,data=request.data, partial=True,context={"request": request})
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)
        cache.delete('all_company_data')
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Company'])
def companydelete(request):
    company = Company.objects.filter(id__in=request.data,internal=False)
    company.delete()
    respdata={'Status':"Success"}
    cache.delete('all_company_data')
    return Response(respdata)
