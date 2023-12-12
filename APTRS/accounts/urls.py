from .views import MyTokenObtainPairView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from django.urls import path
from . import views


urlpatterns = [


    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('changepassword', views.change_password, name='change_password'),
    path('users', views.getallusers, name='getallusers'),
    path('myprofile', views.myprofile, name='getmyprofile'),
    path('editprofile', views.edit_profile, name='editprofile'),
    path('adduser', views.add_user, name='adduser'),
    path('edituser/<int:pk>', views.edit_user, name='edituser'),
    path('deleteuser', views.delete_user),
    path('groups/create/', views.create_group, name='create_group'),
    path('list/permission/', views.list_permissions, name='List All Permissions'),
    path('groups/update/<int:pk>/', views.edit_group, name='update_group'),
    path('groups/list/', views.list_custom_groups, name='List All Groups'),
]

