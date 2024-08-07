from django.urls import path
from .views import ReportStandardCreateView, ReportStandardListView, ProjectTypeCreateView, ProjectTypeListView, ping

urlpatterns = [
    path('standards/create/', ReportStandardCreateView.as_view(), name='create_standard'),
    path('standards/', ReportStandardListView.as_view(), name='list_standards'),
    path('project-type/create/', ProjectTypeCreateView.as_view(), name='create_Project Type'),
    path('project-type/', ProjectTypeListView.as_view(), name='list Project Type'),
    path('ping/', ping, name='ping'),
]
