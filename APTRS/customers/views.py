# Django imprts
import logging
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import status
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from utils.filters import CompanyFilter, UserFilter, paginate_queryset
from utils.permissions import custom_permission_required
from django.db.models import Q, Count, Case, When, IntegerField

#local imports
from project.models import Project
from .project_serializers import ProjectSerializer
from accounts.token_utils import send_token_email
from .models import Company
from .serializers import CompanySerializer, CustomerSerializer, VulnerabilityListSerializer
from .dashboard import getproject_details_core, getVulnerabilityDashboardStats_core, getOrganizationVulnerabilityStats_core, fetch_last_ten_vulnerabilities
from utils.filters import ProjectFilter
from accounts.models import CustomUser

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
        user = serializer.save()

        send_token_email(user, token_type='invitation')
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

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Customer'])
def resend_invitation_api(request, user_id):
    """
    API endpoint to resend an invitation email to a user.

    This endpoint requires the user to be authenticated and have admin privileges.

    Args:
        request: The HTTP request object
        user_id (int): The ID of the user to resend the invitation to

    Returns:
        Response: A JSON response with the result of the operation
    """
    try:
        user = CustomUser.objects.get(pk=user_id)

        # Send invitation email
        send_token_email(user, token_type='invitation')

        return Response({'message': f'Invitation email sent to {user.email}'})


    except CustomUser.DoesNotExist:
        logger.warning(f"Attempt to resend invitation to non-existent user ID: {user_id}")
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


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


##### Customer Dashboard ######

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getproject_details(request):
    user_company = request.user.company

    response_data = getproject_details_core(user_company)
    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getLast_ten_vulnerabilities(request):
    user_company = request.user.company
    vulnerabilities = fetch_last_ten_vulnerabilities(user_company)
    serializer = VulnerabilityListSerializer(vulnerabilities, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getVulnerabilityDashboardStats(request):
    """
    Combined API endpoint that returns two sets of data:
    1. Vulnerability counts by severity for vulnerable, published vulnerabilities
    2. Monthly trends of Critical/High/Medium vulnerabilities for the past 5 months
    """
    user_company = request.user.company
    response_data = getVulnerabilityDashboardStats_core(user_company)
    return Response(response_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getOrganizationVulnerabilityStats(request):
    """
    API endpoint that returns organization security metrics:
    1. Security Score: (1 - (High * 0.6 + Medium * 0.3 + Low * 0.1) / Total) * 100
    2. Remediated Issues: Count of fixed vulnerabilities and percentage
    3. Average Time to Fix: For fixed vulnerabilities
    """
    user_company = request.user.company
    response_data = getOrganizationVulnerabilityStats_core(user_company)
    return Response(response_data)


@api_view(['GET'])
def getCompanyProject(request):
    """
    API endpoint to get all projects for a company.
    Returns:
    1. All non-completed projects that don't have active retests
    2. Projects with active retests (is_completed=False)
    3. Project counts by status (hold, in progress, upcoming, delay)
    No pagination - returns all matching projects.
    """
    user_company = request.user.company

    if not user_company:
        return Response({"error": "User is not associated with any company"}, status=status.HTTP_400_BAD_REQUEST)

    # Create a single query to get both types of projects
    all_projects = Project.objects.filter(
        Q(companyname=user_company) &
        ~Q(status='Completed')  # Not completed projects
    ).filter(
        # Either has no active retests OR has at least one active non-completed retest
        Q(projectretest__isnull=True) |  # No retests at all
        ~Q(projectretest__is_active=True, projectretest__is_completed=False) |  # No active non-completed retests
        Q(projectretest__is_active=True, projectretest__is_completed=False)  # Has active non-completed retests
    ).distinct().order_by('-startdate')
      # Get counts by status
    status_counts = Project.objects.filter(
        Q(companyname=user_company) &
        ~Q(status='Completed')
    ).aggregate(
        on_hold_count=Count(Case(
            When(status='On Hold', then=1),
            output_field=IntegerField()
        )),
        in_progress_count=Count(Case(
            When(status='In Progress', then=1),
            output_field=IntegerField()
        )),
        upcoming_count=Count(Case(
            When(status='Upcoming', then=1),
            output_field=IntegerField()
        )),
        delay_count=Count(Case(
            When(status='Delay', then=1),
            output_field=IntegerField()
        )),
        total_count=Count('id')
    )

    # Serialize projects without pagination
    serializer = ProjectSerializer(all_projects, many=True)

    # Create response with both projects and counts
    response_data = {
        'projects': serializer.data,
        'counts': status_counts
    }

    # Return all projects and counts in the response
    return Response(response_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_completed_projects(request):
    """
    Get all completed projects for the current customer.
    This endpoint is meant for customer users to view their past projects.

    Supports filtering by:
    - name: Filter by project name (case-insensitive)
    - projecttype: Filter by project type (case-insensitive)
    - testingtype: Filter by testing type (case-insensitive)
    - startdate: Filter projects that start on or after this date (format: YYYY-MM-DD)
    - enddate_before: Filter projects that end on or before this date (format: YYYY-MM-DD)

    Supports pagination with:
    - limit: Number of results per page (default: 20, max: 50)
    - offset: Number of results to skip

    Supports sorting with:
    - sort: Field to sort by (default: 'enddate')
    - order_by: Sort order ('asc' or 'desc', default: 'desc')
    """
    try:
        # Get the company ID of the current user
        user_company_id = request.user.company.id

        # Get sorting parameters
        sort_order = request.GET.get('order_by', 'desc')
        sort_field = request.GET.get('sort', 'enddate')

        # Ensure sort field is valid to prevent SQL injection
        valid_sort_fields = ['id', 'name', 'projecttype', 'testingtype', 'startdate', 'enddate']
        if sort_field not in valid_sort_fields:
            sort_field = 'enddate'  # Default to enddate if invalid field

        # Apply sort direction
        if sort_order == 'asc':
            sort_field = sort_field
        else:
            sort_field = f'-{sort_field}'

        # Get all completed projects for the company
        projects = Project.objects.filter(
            companyname_id=user_company_id,
            status='Completed'
        ).order_by(sort_field)

        # Apply filters using ProjectFilter
        project_filter = ProjectFilter(request.GET, queryset=projects)
        filtered_projects = project_filter.qs

        # Additional filter for testingtype which is not in the default ProjectFilter
        testingtype = request.GET.get('testingtype')
        if testingtype:
            filtered_projects = filtered_projects.filter(testingtype__icontains=testingtype)

        # Apply pagination
        paginator, paginated_projects = paginate_queryset(filtered_projects, request)

        # Serialize the projects
        serializer = ProjectSerializer(paginated_projects, many=True)

        # Return response with pagination data
        return Response({
            'count': paginator.count,
            'next': paginator.get_next_link(),
            'previous': paginator.get_previous_link(),
            'results': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching completed projects: {str(e)}")
        return Response(
            {"message": f"An error occurred while fetching completed projects: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )