#django import
from django.db import models
from django.utils import timezone


from ckeditor_uploader.fields import RichTextUploadingField

# local import
from customers.models import Company
from accounts.models import CustomUser


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
    companyname = models.ForeignKey(Company, on_delete=models.CASCADE,editable=False)
    description = models.CharField(max_length=1000, unique = False, null = False, blank = False, default=None)
    projecttype = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    startdate = models.DateField()
    enddate = models.DateField()
    testingtype = models.CharField(max_length=100, unique = False, null = False, blank = False, default="White Box")
    projectexception = models.CharField(max_length=1000, unique = False, null = True, blank = True)
    owner = models.ForeignKey(CustomUser,on_delete=models.CASCADE,blank=True,null=True,to_field='username')
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES, default='Completed')
    

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
        self.status = self.calculate_status
        super(Project, self).save(*args, **kwargs)



class PrjectScope(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    scope = models.CharField(max_length=500, unique = False, null = False, blank = False)
    description = models.CharField(max_length=100, unique = False, null = True, blank = True, default=None)

    def save(self, *args, **kwargs):
        existing_scope = PrjectScope.objects.filter(project=self.project, scope=self.scope).exists()
        if existing_scope:
            return 
        else:
            super(PrjectScope, self).save(*args, **kwargs)



class Vulnerability(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    vulnerabilityname = models.CharField(max_length=300,default=None,blank=True,null=True)
    vulnerabilityseverity = models.CharField(max_length=300,null=True)
    cvssscore = models.FloatField(blank=True,null=True)
    cvssvector = models.CharField(max_length=300,default=None,null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=VULNERABLE)
    vulnerabilitydescription = RichTextUploadingField(blank=True,null=True)
    POC = RichTextUploadingField(default=None,blank=True,null=True)
    created = models.DateTimeField(auto_now_add=True,editable=False,null=True)
    vulnerabilitysolution = RichTextUploadingField(blank=True,null=True)
    vulnerabilityreferlnk = RichTextUploadingField(blank=True,null=True)
   
    class Meta:
        unique_together = (("project", "vulnerabilityname"),)

    def __str__(self):
        return self.vulnerabilityname
    
 
        

class Vulnerableinstance(models.Model):
    vulnerabilityid = models.ForeignKey(Vulnerability, on_delete=models.CASCADE,related_name='instances')
    project = models.ForeignKey(Project, on_delete=models.CASCADE,blank=True,null=True)
    URL = models.CharField(max_length=1000,default=None,blank=True,null=True)
    Paramter = models.CharField(max_length=1000,default=None,blank=True,null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=VULNERABLE)


    def save(self, *args, **kwargs):
        existing_instances = Vulnerableinstance.objects.filter(vulnerabilityid=self.vulnerabilityid, URL=self.URL,Paramter=self.Paramter).exists()
        if existing_instances:
            return
        else:
            super(Vulnerableinstance, self).save(*args, **kwargs)
        




class ProjectRetest(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    startdate = models.DateField()
    enddate = models.DateField()
    owner = models.ForeignKey(CustomUser,on_delete=models.CASCADE,blank=True,null=True,to_field='username')
    
