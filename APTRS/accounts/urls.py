

from django.urls import path
from . import views
from .views import MyTokenObtainPairView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('users', views.getallusers, name='getallusers'),
    path('myprofile', views.myprofile, name='getmyprofile'),
    path('editprofile', views.edit_profile, name='editprofile'),
    path('changepassword', views.change_password, name='change_password'),
    path('adduser', views.add_user, name='adduser'),
    path('edituser/<int:pk>', views.edit_user, name='edituser'),
    path('deleteuser', views.delete_user),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

