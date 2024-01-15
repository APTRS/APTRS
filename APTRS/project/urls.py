from django.urls import path
from . import views
from .views import ImageUploadView


urlpatterns = [
    path('edit-project/<str:pk>/',views.project_edit),
    path('Retest/<str:pk>/',views.RetestList),
    path('findings/<str:pk>/',views.projectfindingview),
    path('vulnerability/<str:pk>/',views.projectvulnview),
    path('vulnerability/instances/<str:pk>/',views.projectvulninstances),
    path('vulnerability/instances/filter/<str:pk>/',views.projectvulninstances_filter),
    path('vulnerability/add/instances/<str:pk>/',views.projectaddinstances),
    path('vulnerability/edit/instances/<str:pk>/',views.projecteditinstances),
    path('vulnerability/delete/instances/',views.projectdeleteinstances),
    path('vulnerability/status/instances/',views.projectinstancesstatus),
    path('vulnerability/status/vulnerability/<str:pk>/',views.projectvulnerabilitystatus),
    path('vulnerability/edit/<str:pk>/',views.projectvulnedit),
    path('vulnerability/delete/vulnerability/',views.projectvulndelete),
    path('Retest/add',views.Retestadd),
    path('Retest/delete/<str:pk>/',views.Retestdelete),
    path('get-projects/',views.GetAllProjects.as_view()),
    path('projects/filter/', views.getallproject_filter, name='Get All Project with Filters and Pagination'),
    path('add-project/',views.newproject,name="Add Project"),
    path('get-project/<str:pk>/',views.getproject),
    path('status/completed/<str:pk>/',views.complete_project_status),
    path('retest/status/completed/<str:pk>/',views.complete_retest_status),
    path('delete-project/',views.deleteproject),
    path('vulnerability/add/vulnerability/',views.create_vulnerability),
    path('ckeditor/imageupload/', ImageUploadView.as_view(),),
    path('vulnerability/Nessus/csv/<str:pk>/', views.Nessus_CSV),
    path('scope/add/<str:pk>/', views.projectaddscope,name="Add Project Scope"),
    path('scope/delete/', views.deleteprojectscope),
    path('scope/edit/<str:pk>/', views.projectscopedit),
    path('scope/<str:pk>/', views.getprojectscopes),
    path('report/<str:pk>/', views.project_report),
    path('ckeditor/delete-images/', views.delete_images, name='delete_images'),
]
