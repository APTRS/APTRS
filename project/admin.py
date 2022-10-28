from django.contrib import admin
from .models import Project,Vulnerability, Vulnerableinstance
# Register your models here.



admin.site.register(Project)
admin.site.register(Vulnerability)
admin.site.register(Vulnerableinstance)