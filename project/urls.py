

from django.urls import path
from . import views
from django.conf.urls import include




urlpatterns = [
    path('', views.project, name='index'),
    #path('project/add', views.projectadd, name='projectadd'),
    #path('project/delete/<str:pk>/', views.projectdelete, name='projectdelete'),
    #path('project/<str:pk>/', views.projectView, name='projectView'),
    #path('project/edit/<str:pk>/', views.projectedit, name='projectedit'),
    #path('project/vulnerability/delete/<str:pk>/', views.projectvulndelete, name='projectvulndelete'),
    #path('project/newvulnerability/<str:pk>/', views.projectnewvuln, name='projectnewvuln'),
    #path('project/fetch/vulnerability', views.fetchvuln, name='fetchvuln'),
    #path('project/editvulnerability/<str:pk>/', views.projecteditvuln, name='projecteditvuln'),
    #path('project/report/addurl/<str:pk>/', views.addurl, name='addurl'),
    #path('project/delete/instace/<str:pk>/', views.deleteinstace, name='deleteinstace'),
    #path('project/report/pdf/<str:pk>/', views.pdf),
    #path('project/add-retest/<str:pk>/',views.addretest),
    path('edit-project/<str:pk>/',views.projecteditapi),
    path('Retest/<str:pk>/',views.RetestList),
    #path('<str:pk>/',views.projectview),
    path('findings/<str:pk>/',views.projectfindingview),
    path('vulnerability/<str:pk>/',views.projectvulnview),
    path('vulnerability/instances/<str:pk>/',views.projectvulninstances),
    path('vulnerability/add/instances/',views.projectaddinstances),
    path('vulnerability/delete/instances/',views.projectdeleteinstances),
    path('vulnerability/edit/<str:pk>/',views.projectvulnedit),
    path('vulnerability/delete/vulnerability/',views.projectvulndelete),
    path('vulnerability/add/vulnerability/',views.projectvulnadd),
    path('Retest/add/<str:pk>/',views.Retestadd),
    path('Retest/delete/<str:pk>/',views.Retestdelete),
    path('get-projects/',views.GetAllProjects.as_view()),
    path('add-project/',views.newproject),
    path('delete-project/',views.deleteproject),


    #path('get-projects/',views.GetAllProjects),
                                           
    

    

]
