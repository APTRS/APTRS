

from django.urls import path
from . import views

urlpatterns = [
    path('login', views.Login, name='login'),
    path('logout', views.Logout, name='logout'),
    path('profile/<str:pk>/', views.profile, name='profile'),
    path('setting', views.setting, name='setting'),
    path('delete/<str:pk>/', views.Delete, name='delete'),
    path('add', views.add, name='add'),
    
]

