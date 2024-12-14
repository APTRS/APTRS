#django import
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

# local import
from customers.models import Company
from accounts.models import CustomUser
from utils.validators import xss_validator

VULNERABLE = 'Vulnerable'
CONFIRMED = 'Confirm Fixed'
ACCEPTED_RISK = 'Accepted Risk'
STATUS_CHOICES = [
        (VULNERABLE, 'Vulnerable'),
        (CONFIRMED, 'Confirm Fixed'),
        (ACCEPTED_RISK, 'Accepted Risk'),
    ]

PROJECT_STATUS_CHOICES = [
        ('Upcoming', 'Upcoming'),
        ('In Progress', 'In Progress'),
        ('Delay', 'Delay'),
        ('Completed', 'Completed'),
    ]

class Project(models.Model):
    name = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    companyname = models.ForeignKey(Company, on_delete=models.CASCADE,editable=False,blank=True,null=True)
    description = models.TextField(unique = False, null = False, blank = False, default=None,validators=[xss_validator])
    projecttype = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    startdate = models.DateField()
    enddate = models.DateField()
    testingtype = models.CharField(max_length=100, unique = False, null = False, blank = False, default="White Box")
    projectexception = models.TextField(unique = False, null = True, blank = True,validators=[xss_validator])
    owner = models.ManyToManyField(CustomUser,blank=True)
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES)

    def clean(self):
        if self.enddate < self.startdate:
            raise ValidationError(_('End date cannot be earlier than start date'))

    @property
    def calculate_status(self):
        current_date = timezone.now().date()
        if current_date < self.startdate:
            return 'Upcoming'
        elif self.startdate <= current_date <= self.enddate:
            return 'In Progress'
        elif current_date > self.enddate:
            return 'Delay'

    def save(self, *args, **kwargs):
        if self.status != 'Completed':
            self.status = self.calculate_status
        super(Project, self).save(*args, **kwargs)

    class Meta:
        ordering = ['-id']



class PrjectScope(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    scope = models.CharField(max_length=500, unique = False, null = False, blank = False)
    description = models.CharField(max_length=100, unique = False, null = True, blank = True, default=None)

    class Meta:
        unique_together = ['project', 'scope']



class Vulnerability(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    vulnerabilityname = models.CharField(max_length=300,default=None,blank=True,null=True)
    vulnerabilityseverity = models.CharField(max_length=300,null=True)
    cvssscore = models.FloatField(blank=True,null=True)
    cvssvector = models.CharField(max_length=300,default=None,null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=VULNERABLE)
    vulnerabilitydescription = models.TextField(blank=True,null=True,validators=[xss_validator])
    POC = models.TextField(default=None,blank=True,null=True,validators=[xss_validator])
    created = models.DateTimeField(auto_now_add=True,editable=False,null=True)
    vulnerabilitysolution = models.TextField(blank=True,null=True,validators=[xss_validator])
    vulnerabilityreferlnk = models.TextField(blank=True,null=True,validators=[xss_validator])
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, editable=False,to_field='id',related_name='vulnerability_created_by')
    last_updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True,to_field='id',related_name='vulnerability_last_updated_by')
    cwe = models.JSONField(null=True, blank=True)


    class Meta:
        unique_together = (("project", "vulnerabilityname"),)

    def __str__(self):
        return self.vulnerabilityname


class Vulnerableinstance(models.Model):
    vulnerabilityid = models.ForeignKey(Vulnerability, on_delete=models.CASCADE,related_name='instances')
    project = models.ForeignKey(Project, on_delete=models.CASCADE,blank=True,null=True)
    URL = models.CharField(max_length=1000,default=None,blank=True,null=True)
    Parameter = models.CharField(max_length=1000,default=None,blank=True,null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=VULNERABLE)


    def save(self, *args, **kwargs):
        existing_instances = Vulnerableinstance.objects.filter(vulnerabilityid=self.vulnerabilityid, URL=self.URL,Parameter=self.Parameter).exists()
        if existing_instances:
            return
        else:
            super(Vulnerableinstance, self).save(*args, **kwargs)


class ProjectRetest(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    startdate = models.DateField()
    enddate = models.DateField()
    owner = models.ManyToManyField(CustomUser,blank=True)
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES)

    def clean(self):
        if self.enddate < self.startdate:
            raise ValidationError(_('End date cannot be earlier than start date'))

    @property
    def calculate_status(self):
        current_date = timezone.now().date()
        if current_date < self.startdate:
            return 'Upcoming'
        elif self.startdate <= current_date <= self.enddate:
            return 'In Progress'
        elif current_date > self.enddate:
            return 'Delay'

    def save(self, *args, **kwargs):
        if self.status != 'Completed':
            self.status = self.calculate_status
        super(ProjectRetest, self).save(*args, **kwargs)
