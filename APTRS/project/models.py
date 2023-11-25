from django.db import models
from customers.models import Company, Customer
from ckeditor_uploader.fields import RichTextUploadingField
from django.utils import timezone

# Create your models here.


class Project(models.Model):
    name = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    companyname = models.ForeignKey(Company, on_delete=models.CASCADE)
    scope = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    description = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    projecttype = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    startdate = models.DateField()
    enddate = models.DateField()

class Vulnerability(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    vulnerabilityname = models.CharField(max_length=300,default=None,blank=True,null=True)
    vulnerabilityseverity = models.CharField(max_length=300,null=True)
    cvssscore = models.FloatField(blank=True,null=True)
    cvssvector = models.CharField(max_length=300,default=None,null=True)
    status = models.CharField(max_length=300,null=True)
    vulnerabilitydescription = RichTextUploadingField(blank=True,null=True)
    POC = RichTextUploadingField(default=None,blank=True,null=True)
    created = models.DateTimeField(editable=False,default=None, null=True)
    vulnerabilitysolution = RichTextUploadingField(blank=True,null=True)
    vulnerabilityreferlnk = RichTextUploadingField(blank=True,null=True)
    #vulnerableurl =  models.CharField(max_length=1000,default=None,blank=True,null=True)


class Vulnerableinstance(models.Model):
    vulnerabilityid = models.ForeignKey(Vulnerability, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE,blank=True,null=True)
    URL = models.CharField(max_length=1000,default=None,blank=True,null=True)
    Paramter = models.CharField(max_length=1000,default=None,blank=True,null=True)
