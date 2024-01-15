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

from ckeditor_uploader import views as ckeditor_views

urlpatterns = [
    path('api/project/',include('project.urls')),
    path('api/vulndb/',include('vulnerability.urls')),
    path('api/auth/',include('accounts.urls')),
    path('api/customer/',include('customers.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT,}),
    re_path(r'^static-report/(?P<path>.*)$', serve, {'document_root': settings.STATICFILES_DIRS[0],}),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATICFILES_DIRS[1]}),
    path('', TemplateView.as_view(template_name='index.html')),
]

if settings.DEBUG:
    urlpatterns = urlpatterns + [
    path('admin/', admin.site.urls),
    path('ckeditor/upload/', ckeditor_views.upload, name='ckeditor_upload'),
    re_path(r'^ckeditor/', include('ckeditor_uploader.urls')),
    path('ckeditor/', include('ckeditor_uploader.urls')),
    ]
