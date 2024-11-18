"""
Import required Django classes and methods.
CKEditor image upload has custom REST API to upload images
Default ckeditor image handler only requires for Django Admin
"""

from django.urls import path, include,re_path
from django.conf import settings
from django.conf.urls.static import serve
from django.contrib import admin
from django.views.generic import TemplateView

urlpatterns = [
    path('api/project/',include('project.urls')),
    path('api/vulndb/',include('vulnerability.urls')),
    path('api/auth/',include('accounts.urls')),
    path('api/customer/',include('customers.urls')),
    path('api/config/', include('configapi.urls')),
]

if settings.DEBUG:
    urlpatterns = urlpatterns + [
    path('admin/', admin.site.urls),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT,}),
    re_path(r'^static-report/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT}),
    path('', TemplateView.as_view(template_name='index.html')),
    path("__debug__/", include("debug_toolbar.urls")),
    ]
