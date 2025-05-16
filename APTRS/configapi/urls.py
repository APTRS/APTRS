from django.urls import path
from .views import (
    create_report_standard,
    list_report_standards,
    edit_report_standard,
    delete_report_standard,
    create_project_type,
    list_project_types,
    edit_project_type,
    delete_project_type,
    ping
)

urlpatterns = [
    path('standards/create/', create_report_standard, name='create_standard'),
    path('standards/', list_report_standards, name='list_standards'),
    path('standards/edit/<int:pk>/', edit_report_standard, name='edit_standard'),
    path('standards/delete/<int:pk>/', delete_report_standard, name='delete_standard'),
    path('project-type/create/', create_project_type, name='create_project_type'),
    path('project-type/', list_project_types, name='list_project_type'),
    path('project-type/edit/<int:pk>/', edit_project_type, name='edit_project_type'),
    path('project-type/delete/<int:pk>/', delete_project_type, name='delete_project_type'),
    path('ping/', ping, name='ping'),
]
