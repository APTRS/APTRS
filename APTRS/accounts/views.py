
from rest_framework import views
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAdminUser,IsAuthenticated
from rest_framework import viewsets
from rest_framework import status 
import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import CustomGroup
from .serializers import ChangePasswordSerializer, CustomUserSerializer,ProfileUserSerializer, CustomGroupSerializer,CustomPermissionSerializer
from utils.permissions import custom_permission_required
from .models import CustomUser , CustomPermission
from utils.filters import UserFilter, paginate_queryset

logger = logging.getLogger(__name__)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        # Add extra responses here
        data['Status'] = "True"
        data['username'] = self.user.username
        data['Pic'] = self.user.profilepic.url
        data['isAdmin'] = self.user.is_superuser
        #data['company'] = self.user.company
        data['isStaff'] = self.user.is_staff
        
        permissions = set()  # Use set to avoid duplicate permissions

        # Fetching permissions associated with user's groups
        user_groups = CustomGroup.objects.filter(customuser=self.user)
        for group in user_groups:
            permissions |= set(group.list_of_permissions.all().values_list('name', flat=True))

        data['permissions'] = list(permissions)  # Add collected permissions to response
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Change Password'])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):
        return Response({'message': 'Password updated.'})

    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View All Users'])
def getallusers(request):
    userdetails = CustomUser.objects.filter(is_staff=True)
    serializer = CustomUserSerializer(userdetails, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View All Users'])
def getallusers_filter(request):
    userdetails = CustomUser.objects.filter(is_staff=True)

    user_filter = UserFilter(request.GET, queryset=userdetails)
    filtered_queryset = user_filter.qs
    paginator, paginated_queryset = paginate_queryset(filtered_queryset, request)
    serializer = CustomUserSerializer(paginated_queryset, many=True)

    return paginator.get_paginated_response(serializer.data)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View All Users'])
def ActiveUserList(request):
    usernames = CustomUser.objects.filter(is_active=True,is_staff=True).values_list('username', flat=True)
    return Response(usernames)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Profile'])
def myprofile(request):
    serializer = CustomUserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser ])  ## IsAdminUser is allow only staff internal users not for is_superuser(admin)
@custom_permission_required(['Edit Profile'])
def edit_profile(request):
    user = request.user

    user_serializer = ProfileUserSerializer(user, data=request.data, partial=True, context={'request': request})
    
    
    if user_serializer.is_valid(raise_exception=True):
        user_serializer.save()
        return Response(user_serializer.data)

    else:
        logger.error("Serializer errors: %s", str(user_serializer.errors))
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add User'])
def add_user(request):
    user_serializer = CustomUserSerializer(data=request.data, context={'request': request})
    if user_serializer.is_valid(raise_exception=True):
        user_serializer.save()
        return Response(user_serializer.data)
    else:
        logger.error("Serializer errors: %s", str(user_serializer.errors))
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit User'])
def edit_user(request,pk):
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
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete User'])
def delete_user(request):
    user = CustomUser.objects.filter(id__in=request.data)
    user.delete()
    respdata={'Status':"Success"}
    return Response(respdata)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Create Group'])
def create_group(request):
    serializer = CustomGroupSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Permissions'])
def list_permissions(request):
    permissions = CustomPermission.objects.all()
    serializer = CustomPermissionSerializer(permissions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Group'])
def edit_group(request, pk):
    try :
        group = CustomGroup.objects.get(pk=pk)
    except CustomGroup.DoesNotExist:
        return Response({'error': 'Group not found'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = CustomGroupSerializer(instance=group, data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@custom_permission_required(['View Group'])
def list_custom_groups(request):
    groups = CustomGroup.objects.all()
    serializer = CustomGroupSerializer(groups, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
def user_detail(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
    except CustomUser.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    serializer = CustomUserSerializer(user)
    return Response(serializer.data)