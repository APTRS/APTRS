

from django.urls import path
from . import views
from django.conf.urls import include




urlpatterns = [
    path('', views.project, name='index'),
    path('project/add', views.projectadd, name='projectadd'),
    path('project/delete/<str:pk>/', views.projectdelete, name='projectdelete'),
    path('project/<str:pk>/', views.projectView, name='projectView'),
    path('project/edit/<str:pk>/', views.projectedit, name='projectedit'),
    path('project/vulnerability/delete/<str:pk>/', views.projectvulndelete, name='projectvulndelete'),
    path('project/newvulnerability/<str:pk>/', views.projectnewvuln, name='projectnewvuln'),
    path('project/fetch/vulnerability', views.fetchvuln, name='fetchvuln'),
    path('project/editvulnerability/<str:pk>/', views.projecteditvuln, name='projecteditvuln'),
    path('project/report/addurl/<str:pk>/', views.addurl, name='addurl'),
    path('project/delete/instace/<str:pk>/', views.deleteinstace, name='deleteinstace'),
    path('project/report/pdf/<str:pk>/', views.pdf),
                                           
    

    

]
