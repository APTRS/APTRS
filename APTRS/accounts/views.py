from django.contrib.auth.models import User
from .models import Profile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics
from .serializers import UserSerializer,ProfileSerializer, ChangePasswordSerializer,AdminUserSerializer
from rest_framework import views
from rest_framework.response import Response
from rest_framework.decorators import api_view,permission_classes
from rest_framework.permissions import IsAdminUser,IsAuthenticated
from rest_framework import viewsets
from rest_framework import status 

import logging


logger = logging.getLogger(__name__)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getallusers(request):
    userdetails = User.objects.all()
    serializer = UserSerializer(userdetails, many=True)
    return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def myprofile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def edit_profile(request):
    user = request.user
    try:
        profile = user.userprofile
    except Profile.DoesNotExist:
        profile = Profile(user=user)
    user_serializer = UserSerializer(user, data=request.data,context={'request': request})
    profile_serializer = ProfileSerializer(profile, data=request.data,partial=True)

    if user_serializer.is_valid(raise_exception=True) and profile_serializer.is_valid(raise_exception=True):
        user_serializer.save()
        profile_serializer.save()
        return Response(user_serializer.data)
    
    else:
        logger.error("Serializer errors: %s", str(user_serializer.errors))
        logger.error("Serializer errors: %s", str(profile_serializer.errors))
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
def add_user(request):
    user_serializer = AdminUserSerializer(data=request.data,context={'request': request})
    profile_serializer = ProfileSerializer(data=request.data,partial=True)

    if user_serializer.is_valid(raise_exception=True) and profile_serializer.is_valid(raise_exception=True):
        user_serializer.save()
        return Response(user_serializer.data)
    else:
        logger.error("Serializer errors: %s", str(user_serializer.errors))
        return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated,IsAdminUser])
def edit_user(request,pk):
    user = User.objects.get(pk=pk)
    serializer = AdminUserSerializer(instance=user,data=request.data,context={'request': request})
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        return Response(serializer.data)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



@api_view(['DELETE'])
@permission_classes([IsAuthenticated,IsAdminUser])
def delete_user(request):
    user = User.objects.filter(id__in=request.data)
    user.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        # Add extra responses here
        data['Status'] = "True"
        data['username'] = self.user.username
        data['Pic'] = self.user.userprofile.profilepic.url
        data['isAdmin'] = self.user.is_superuser
        return data


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):
        return Response({'message': 'Password updated.'})

    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)