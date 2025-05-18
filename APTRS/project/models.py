#django import
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

# local import
from customers.models import Company
from accounts.models import CustomUser
from utils.validators import xss_validator
from utils.project_status import update_project_status
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
        ('On Hold', 'On Hold'),
        ('Completed', 'Completed'),
    ]

class Project(models.Model):
    name = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    companyname = models.ForeignKey(Company, on_delete=models.CASCADE,editable=False,blank=True,null=True)
    description = models.TextField(unique = False, null = False, blank = False, default=None,validators=[xss_validator])
    projecttype = models.CharField(max_length=100, unique = False, null = False, blank = False, default=None)
    startdate = models.DateField()
    enddate = models.DateField()
    testingtype = models.CharField(max_length=100, unique = False, null = True, blank = True, default="White Box")
    projectexception = models.TextField(unique = False, null = True, blank = True,validators=[xss_validator])
    owner = models.ManyToManyField(CustomUser,blank=True)
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES)
    standard = models.JSONField(default=list)
    hold_reason = models.TextField(null=True, blank=True, help_text="Reason why the project is on hold")

    def clean(self):
        if self.enddate < self.startdate:
            raise ValidationError(_('End date cannot be earlier than start date'))

    @property
    def calculate_status(self):
        current_date = timezone.now().date()
        # If project is marked as "On Hold", preserve this status
        if self.status == 'On Hold':
            return 'On Hold'

        # Check if there are any active retests (not completed and is active)
        active_retests = ProjectRetest.objects.filter(
            project=self,
            is_active=True,
            is_completed=False
        ).order_by('-startdate')

        if active_retests.exists():
            active_retest = active_retests.first()
            # Use retest dates for status calculation
            if current_date < active_retest.startdate:
                return 'Upcoming'
            elif active_retest.startdate <= current_date <= active_retest.enddate:
                return 'In Progress'
            elif current_date > active_retest.enddate:
                return 'Delay'
        else:
            # If no active retest, use project dates for status calculation
            if self.status == 'Completed':
                return 'Completed'
            elif current_date < self.startdate:
                return 'Upcoming'
            elif self.startdate <= current_date <= self.enddate:
                return 'In Progress'
            elif current_date > self.enddate:
                return 'Delay'

    def save(self, *args, **kwargs):
        # Clear hold_reason if status is not "On Hold"
        if self.status != 'On Hold' and self.hold_reason:
            self.hold_reason = None

        # Only update status if project is not completed or on hold
        if self.status not in ['Completed', 'On Hold']:
            update_project_status(self)
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
    published_date = models.DateTimeField(null=True, blank=True)
    fixed_date = models.DateTimeField(null=True, blank=True)
    vulnerabilitysolution = models.TextField(blank=True,null=True,validators=[xss_validator])
    vulnerabilityreferlnk = models.TextField(blank=True,null=True,validators=[xss_validator])
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, editable=False,to_field='id',related_name='vulnerability_created_by')
    last_updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True,to_field='id',related_name='vulnerability_last_updated_by')
    cwe = models.JSONField(null=True, blank=True)
    published = models.BooleanField(default=False)

    class Meta:
        unique_together = (("project", "vulnerabilityname"),)

    def save(self, *args, **kwargs):
        # Set published_date when a vulnerability is published for the first time
        if self.published and not self.published_date:
            self.published_date = timezone.now()
        # If unpublished, clear the published date
        elif not self.published:
            self.published_date = None

        # Set fixed_date when a vulnerability is marked as fixed for the first time
        if self.status == CONFIRMED and not self.fixed_date:
            self.fixed_date = timezone.now()
        # If not confirmed fixed, clear the fixed date
        elif self.status != CONFIRMED:
            self.fixed_date = None

        super(Vulnerability, self).save(*args, **kwargs)

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
    is_active = models.BooleanField(default=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def clean(self):
        if self.enddate < self.startdate:
            raise ValidationError(_('End date cannot be earlier than start date'))



    def save(self, *args, **kwargs):
        # Save the retest first
        super(ProjectRetest, self).save(*args, **kwargs)

        # Then update the project's status if this is an active retest
        if self.is_active and not self.is_completed:
            project = self.project
            update_project_status(project)