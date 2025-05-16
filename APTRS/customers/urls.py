from django.urls import path
from . import views


urlpatterns = [
    path('all-company',views.getallcompnay),
    path('all-company/filter',views.getallcompnay_filter),
    path('all-customer',views.getallcustomer),
    path('all-customer/filter',views.getallcustomer_filter),
    path('customer/<str:pk>/',views.getcustomer),
    path('customer/edit/<str:pk>/',views.customeredit),
    path('customer/add',views.customeradd),
    path('customer/delete',views.customerdelete),
    path('token/invitation/resend/<int:user_id>/', views.resend_invitation_api, name='resend_invitation'),
    path('company/<str:pk>/',views.getcompany),
    path('company/add',views.add_company,name='Add Company'),
    path('company/edit/<str:pk>/',views.edit_company),
    path('company/delete',views.companydelete),
    path('company/projects/status',views.getproject_details),
    path('company/projects/last/findings',views.getLast_ten_vulnerabilities),
    path('company/projects/vulnerability/trends',views.getVulnerabilityDashboardStats),
    path('company/projects/vulnerability/stats',views.getOrganizationVulnerabilityStats),
    path('company/projects/details',views.getCompanyProject, name='company_projects'),
    path('company/projects/completed', views.get_completed_projects, name='completed_projects'),
]
