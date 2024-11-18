# Django imports
from django.urls import path

# local imports
from . import views
from .views import MyTokenObtainPairView,LogoutGetView, MyTokenRefreshView


urlpatterns = [


    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', MyTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutGetView.as_view(), name='logout'),
    path('changepassword', views.change_password, name='change_password'),
    path('users', views.getallusers, name='getallusers'),
    path('users-active', views.ActiveUserList, name='Get All Active Users'),
    path('users/filter/', views.getallusers_filter, name='Get All User with Filters and Pagination'),
    path('user/<int:pk>', views.user_detail, name='user_detail'),
    path('myprofile', views.myprofile, name='getmyprofile'),
    path('editprofile', views.edit_profile, name='editprofile'),
    path('adduser', views.add_user, name='adduser'),
    path('edituser/<int:pk>', views.edit_user, name='edituser'),
    path('deleteuser', views.delete_user),
    path('groups/create/', views.create_group, name='create_group'),
    path('groups/delete', views.delete_custom_groups, name='delete group'),
    path('list/permission/', views.list_permissions, name='List All Permissions'),
    path('groups/update/<int:pk>/', views.edit_group, name='update_group'),
    path('groups/list/', views.list_custom_groups, name='List All Groups'),
]
