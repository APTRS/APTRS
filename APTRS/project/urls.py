from django.urls import path
from .views import project, retest, vulnerability,image_upload, scope
from .views.image_upload import GetImageView

urlpatterns = [
    ## Project
    path('edit-project/<str:pk>/',project.project_edit),
    path('get-projects/',project.GetAllProjects.as_view()),
    path('my-projects/',project.GetMyProjects.as_view()),
    path('projects/filter/', project.getallproject_filter, name='Get All Project with Filters and Pagination'),
    path('add-project/',project.newproject,name="Add Project"),
    path('edit-owner/',project.update_project_owner_view,name="Update Project Owner"),
    path('get-project/<str:pk>/',project.getproject),
    path('delete-project/',project.deleteproject),
    path('status/completed/<str:pk>/',project.complete_project_status),
    path('status/reopen/<str:pk>/',project.reopen_project_status),
    path('report/<str:pk>/', project.project_report,name="generate report"),

    # Scope
    path('scope/add/<str:pk>/', scope.projectaddscope,name="Add Project Scope"),
    path('scope/delete/', scope.deleteprojectscope),
    path('scope/edit/<str:pk>/', scope.projectscopedit),
    path('scope/<str:pk>/', scope.getprojectscopes),

    ## Retest
    path('Retest/<str:pk>/',retest.RetestList),
    path('Retest/add',retest.Retestadd),
    path('Retest/delete/<str:pk>/',retest.Retestdelete),
    path('retest/status/completed/<str:pk>/',retest.complete_retest_status),

    # Project Vulnerability
    path('findings/<str:pk>/',vulnerability.projectfindingview),
    path('vulnerability/<str:pk>/',vulnerability.projectvulnview),
    path('vulnerability/status/vulnerability/<str:pk>/',vulnerability.projectvulnerabilitystatus),
    path('vulnerability/edit/<str:pk>/',vulnerability.projectvulnedit),
    path('vulnerability/delete/vulnerability/',vulnerability.projectvulndelete),
    path('vulnerability/add/vulnerability/',vulnerability.create_vulnerability,name="Add vulnerability"),
    path('vulnerability/Nessus/csv/<str:pk>/', vulnerability.Nessus_CSV),
    path('vulnerability/view/<str:pk>/',vulnerability.vulnerability_view),

    # Vulnerability Instances
    path('vulnerability/instances/<str:pk>/',vulnerability.projectvulninstances),
    path('vulnerability/instances/filter/<str:pk>/',vulnerability.projectvulninstances_filter),
    path('vulnerability/add/instances/<str:pk>/',vulnerability.projectaddinstances),
    path('vulnerability/edit/instances/<str:pk>/',vulnerability.projecteditinstances),
    path('vulnerability/delete/instances/',vulnerability.projectdeleteinstances),
    path('vulnerability/status/instances/',vulnerability.projectinstancesstatus),

    # images
    path('ckeditor/imageupload/', image_upload.ImageUploadView.as_view(),),
    path('ckeditor/delete-images/', image_upload.delete_images, name='delete_images'),
    path('getimage/', GetImageView.as_view(), name='get_image'),
]
