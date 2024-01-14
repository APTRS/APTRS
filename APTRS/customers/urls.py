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
    path('company/<str:pk>/',views.getcompany),
    path('company/add',views.add_company,name='Add Company'),
    path('company/edit/<str:pk>/',views.edit_company),
    path('company/delete',views.companydelete),
]
