from django.urls import path
from .views import ReportStandardCreateView, ReportStandardListView

urlpatterns = [
    path('standards/create/', ReportStandardCreateView.as_view(), name='create_standard'),
    path('standards/', ReportStandardListView.as_view(), name='list_standards'),
]
