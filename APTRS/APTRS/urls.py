from django.urls import path, include,re_path
from django.conf import settings
from django.conf.urls.static import serve
from django.views.generic import RedirectView
from django.contrib import admin

from ckeditor_uploader import views as ckeditor_views

urlpatterns = [
    path('api/project/',include('project.urls')),
    path('api/vulndb/',include('vulnerability.urls')),
    path('api/auth/',include('accounts.urls')),
    path('api/customer/',include('customers.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT,}),
    #re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT,}),
    path('', RedirectView.as_view(url='/api/auth/login/', permanent=True)),
    


   
]

#urlpatterns = urlpatterns + static('/media/', document_root = settings.MEDIA_ROOT)
#urlpatterns = urlpatterns + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    urlpatterns = urlpatterns + [
    path('admin/', admin.site.urls),
    path('ckeditor/upload/', ckeditor_views.upload, name='ckeditor_upload'), 
    re_path(r'^ckeditor/', include('ckeditor_uploader.urls')),
    path('ckeditor/', include('ckeditor_uploader.urls')),
    ]
    #from django.conf.urls.static import static
    #urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])

