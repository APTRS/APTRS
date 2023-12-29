

from django.urls import path
from . import views
from django.conf.urls import include


urlpatterns = [
    path('all-company',views.getallcompnay),
    path('all-customer',views.getallcustomer),
    path('customer/<str:pk>/',views.getcustomer),
    path('customer/edit/<str:pk>/',views.customeredit),
    path('customer/add',views.customeradd),
    path('customer/delete',views.customerdelete),
    path('company/<str:pk>/',views.getcompany),
    path('company/add',views.add_company,name='Add Company'),
    path('company/edit/<str:pk>/',views.edit_company),
    path('company/delete',views.companydelete),
]