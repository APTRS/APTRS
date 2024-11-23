# Django imports
import logging
from django.views.decorators.cache import cache_page
from django.core.cache import cache
from rest_framework import status
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenRefreshView
# local imports
from utils.filters import UserFilter, paginate_queryset
from utils.permissions import custom_permission_required
from .throttles import LoginThrottle
from .models import CustomGroup, CustomPermission, CustomUser
from .serializers import (ChangePasswordSerializer, CustomGroupSerializer,
                          CustomPermissionSerializer, CustomUserSerializer,
                          ProfileUserSerializer)

logger = logging.getLogger(__name__)



class MyTokenRefreshView(TokenRefreshView):

    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            logger.error("Error while refreshing token: %s", str(e), exc_info=True)
            return Response({'detail': 'Invalid refresh token.'}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        # Extract the new access token
        access_token = data.get("access")
        refresh_token = data.get("refresh", None)
        response = Response(data, status=status.HTTP_200_OK)
        response.set_cookie(
                key='access_token',
                value=access_token,
                httponly=True,secure=True,samesite='Lax',path='/'
            )
        response.data = {'access': access_token,'refresh':refresh_token}
        return response


class LogoutGetView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            response = Response("OK",status=status.HTTP_200_OK)
            response.delete_cookie('access_token', path='/')
            return response
        except Exception as e:
            logger.error("Error while refreshing token: %s", str(e), exc_info=True)
            return Response({'detail': 'Invalid refresh token.'}, status=status.HTTP_400_BAD_REQUEST)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Token serializer for obtaining JWT tokens with additional user information.

    This serializer extends the functionality of TokenObtainPairSerializer to include
    extra user information such as status, username, profile picture URL, isAdmin, isStaff,
    and a list of permissions associated with the user's groups.

    Attributes:
    - Status (str): Indicates the status of the token generation process (True/False).
    - username (str): The username of the authenticated user.
    - Pic (str): The URL of the user's profile picture.
    - isAdmin (bool): Indicates whether the user has superuser privileges.
    - isStaff (bool): Indicates whether the user has staff privileges.
    - permissions (list): A list of permissions associated with the user's groups.

    Note:
    - The associated groups and permissions are fetched based on the user's groups.
    """


    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_staff:
            raise serializers.ValidationError("Only staff users are allowed to login.")

        # Add extra responses here
        data['Status'] = "True"
        data['username'] = self.user.username
        data['Pic'] = self.user.profilepic.url
        data['isAdmin'] = self.user.is_superuser
        data['isStaff'] = self.user.is_staff
        permissions = set()  # Use set to avoid duplicate permissions

        # Fetching permissions associated with user's groups
        user_groups = self.user.groups.all()
        for group in user_groups:
            permissions.update(group.list_of_permissions.values_list('name', flat=True))

        data['permissions'] = list(permissions)  # Add collected permissions to response
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    """
    API view for obtaining JWT tokens.

    This view extends the functionality of TokenObtainPairView and uses the
    MyTokenObtainPairSerializer to include extra user information in the response.
    """
    serializer_class = MyTokenObtainPairSerializer
    throttle_classes = [LoginThrottle, AnonRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            logger.error("Error while refreshing token: %s", str(e), exc_info=True)
            return Response({'detail': "Something Went Wrong"}, status=status.HTTP_401_UNAUTHORIZED)

        # Get the token data
        token_data = serializer.validated_data

        # Create a response object
        response = Response(token_data, status=status.HTTP_200_OK)

        # Set the JWT token in the cookie
        response.set_cookie(key='access_token',value=token_data['access'],httponly=True,secure=True,samesite='Lax',path='/')
        return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    API endpoint for changing the user's password.

    This endpoint requires the user to be authenticated and have the 'Change Password'
    custom permission. The user provides the old and new passwords through a POST request.

    Example Usage:
    - Ensure the user is authenticated and has the 'Change Password' permission.
    - Send a POST request to this endpoint with the following data:
      {
          "oldpassword": "current_password",
          "newpassword": "new_password"
      }

    Response:
    - If the password change is successful, the endpoint returns a success message.
    - If there are validation errors, the endpoint returns a JSON object with detailed error messages.
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):
        user = request.user
        user.set_password(serializer.validated_data['newpassword'])
        user.save()
        return Response({'message': 'Password updated.'})

    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
@cache_page(3600)
def getallusers(request):
    """
    API endpoint for retrieving details of all staff/Internal users.

    This endpoint requires the user to be authenticated and have the 'View All Users'
    custom permission. It returns details of all users who have the 'is_staff' flag set to True.

    Example Usage:
    - Ensure the user is authenticated and has the 'View All Users' permission.
    - Send a GET request to this endpoint.

    Response:
    - If the user has the required permissions, the endpoint returns a JSON object
      containing details of all staff users.
    """
    userdetails = CustomUser.objects.filter(is_staff=True)
    serializer = CustomUserSerializer(userdetails, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def getallusers_filter(request):
    """
    API endpoint for retrieving and filtering details of all staff users.

    This endpoint requires the user to be authenticated and have the 'View All Users'
    custom permission. It returns details of all users who have the 'is_staff' flag set to True.

    Response:
    - If the user has the required permissions, the endpoint returns a JSON object
      containing details of staff users, optionally filtered based on query parameters.
    """
    sort_order = request.GET.get('order_by', 'desc')
    sort_field = request.GET.get('sort', 'id') or 'id'

    cache_key = 'all_staff_users_data'
    userdetails = cache.get(cache_key)

    if not userdetails:
        userdetails = CustomUser.objects.filter(is_staff=True).select_related('company').prefetch_related('groups')
        cache.set(cache_key, userdetails, timeout=3600)

    user_filter = UserFilter(request.GET, queryset=userdetails)
    filtered_queryset = user_filter.qs
    if sort_order == 'asc':
        filtered_queryset = filtered_queryset.order_by(sort_field)
    else:
        filtered_queryset = filtered_queryset.order_by('-'+sort_field)
    paginator, paginated_queryset = paginate_queryset(filtered_queryset, request)
    serializer = CustomUserSerializer(paginated_queryset, many=True)

    return paginator.get_paginated_response(serializer.data)




@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@cache_page(3600)
def ActiveUserList(request):
    """
    API endpoint for retrieving a list of active staff user usernames.
    This API was created to list active usernames to select project owner at frontend.

    This endpoint requires the user to be authenticated and have the 'View All Users'
    custom permission. It returns a list of usernames for users who are both active and staff.

    Response:
    - If the user has the required permissions, the endpoint returns a JSON array
      containing the usernames of active staff users.
    """
    usernames = CustomUser.objects.filter(is_active=True,is_staff=True).values_list('username', flat=True)
    return Response(usernames)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
def myprofile(request):
    """
    API endpoint for retrieving the profile information of the authenticated user.

    This endpoint requires the user to be authenticated and have the 'View Profile'
    custom permission. It returns a JSON object containing the serialized profile
    information of the authenticated user.

    Response:
    - If the user has the required permissions, the endpoint returns a JSON object
      containing the profile details of the authenticated user.
    """

    serializer = CustomUserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser ])  ## IsAdminUser is allow only staff internal users not for is_superuser(admin)
def edit_profile(request):
    """
    API endpoint for editing the profile information of the authenticated user.

    This endpoint requires the user to be authenticated, have the 'staff' permission,
    and the 'Edit Profile' custom permission. It allows updating the profile details of the user.

    Method: POST

    Response:
    - If the user has the required permissions and the request data is valid,
      the endpoint updates the profile information and returns a JSON object
      containing the serialized updated user profile.
    """
    user = request.user

    user_serializer = ProfileUserSerializer(user, data=request.data, partial=True, context={'request': request})


    if user_serializer.is_valid(raise_exception=True):
        user_serializer.save()
        return Response(user_serializer.data)

    else:
        logger.error("Serializer errors: %s", str(user_serializer.errors))
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def add_user(request):
    user_serializer = CustomUserSerializer(data=request.data, context={'request': request})
    if user_serializer.is_valid(raise_exception=True):
        user_serializer.save()
        return Response(user_serializer.data)
    else:
        logger.error("Serializer errors: %s", str(user_serializer.errors))
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def edit_user(request,pk):
    """
    API endpoint for adding a new user.

    This endpoint requires the user to be authenticated and have the 'Add User' custom permission.
    It allows creating a new user by providing the required information in the request body.

    Response:
    - If the user has the required permissions and the request data is valid,
      the endpoint creates a new user and returns a JSON object containing
      the serialized details of the newly created user.
    """
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CustomUserSerializer(instance=user,data=request.data,context={'request': request})
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        return Response(serializer.data)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def delete_user(request):
    user = CustomUser.objects.filter(id__in=request.data)
    user.delete()
    respdata={'Status':"Success"}
    return Response(respdata)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def create_group(request):
    serializer = CustomGroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
@cache_page(3600)
def list_permissions(request):
    permissions = CustomPermission.objects.all()
    serializer = CustomPermissionSerializer(permissions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def edit_group(request, pk):
    try :
        group = CustomGroup.objects.get(pk=pk)
    except CustomGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = CustomGroupSerializer(instance=group, data=request.data)
    if serializer.is_valid():
        serializer.save()
        cache.delete("list_custom_groups_cache_key")
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
@custom_permission_required(['Manage Users'])
def list_custom_groups(request):
    cached_data = cache.get("list_custom_groups_cache_key")
    if cached_data:
        return Response(cached_data, status=status.HTTP_200_OK)

    groups = CustomGroup.objects.all()
    serializer = CustomGroupSerializer(groups, many=True)
    response_data = serializer.data
    cache.set("list_custom_groups_cache_key", response_data, 3600)
    return Response(response_data, status=status.HTTP_200_OK)



@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def delete_custom_groups(request):
    group = CustomGroup.objects.filter(id__in=request.data)
    group.delete()
    cache.delete("list_custom_groups_cache_key")
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['GET'])
@permission_classes([IsAuthenticated,IsAdminUser])
@custom_permission_required(['Manage Users'])
def user_detail(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CustomUserSerializer(user)
    return Response(serializer.data)
