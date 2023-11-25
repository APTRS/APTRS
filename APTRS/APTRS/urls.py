from django.urls import path, include,re_path
from django.conf import settings
from django.conf.urls.static import serve



urlpatterns = [
    path('api/project/',include('project.urls')),
    path('api/vulndb/',include('vulnerability.urls')),
    path('api/auth/',include('accounts.urls')),
    path('api/customer/',include('customers.urls')),
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT,}),
    re_path(r'^static/(?P<path>.*)$', serve, {'document_root': settings.STATIC_ROOT,}),
]

#urlpatterns = urlpatterns + static('/media/', document_root = settings.MEDIA_ROOT)
#urlpatterns = urlpatterns + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


