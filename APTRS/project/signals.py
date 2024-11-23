from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Project, Vulnerability, Vulnerableinstance, ProjectRetest

VULNERABLE = 'Vulnerable'
CONFIRMED = 'Confirm Fixed'
ACCEPTED_RISK = 'Accepted Risk'
STATUS_CHOICES = [
        (VULNERABLE, 'Vulnerable'),
        (CONFIRMED, 'Confirm Fixed'),
        (ACCEPTED_RISK, 'Accepted Risk'),
    ]


@receiver(post_save, sender=Vulnerability)
def update_vulnerability(sender, instance, created, **kwargs):
    if not created:


        # Call another model instance where vulnerabilityid = this id
        totalinstances = Vulnerableinstance.objects.filter(vulnerabilityid=instance.pk)

        # Check the status of the related instances
        has_vulnerable = totalinstances.filter(status=VULNERABLE).exists()
        has_accepted_risk = totalinstances.filter(status=ACCEPTED_RISK).exists()
        has_confirm_fix = totalinstances.filter(status=CONFIRMED).count() == totalinstances.count()

        # Update the status of the Vulnerability based on the related instances
        if has_vulnerable:
            instance.status = VULNERABLE

        elif has_accepted_risk:
            instance.status = ACCEPTED_RISK

        elif has_confirm_fix:
            instance.status = CONFIRMED

        Vulnerability.objects.filter(pk=instance.pk).update(status=instance.status)





@receiver(post_save, sender=Vulnerableinstance)
def update_vulnerableinstance(sender, instance, created, **kwargs):
    if not created:
        totalinstances = Vulnerableinstance.objects.filter(vulnerabilityid=instance.vulnerabilityid.pk)

        has_vulnerable = totalinstances.filter(status=VULNERABLE).exists()
        has_accepted_risk = totalinstances.filter(status=ACCEPTED_RISK).exists()
        has_confirm_fix = totalinstances.filter(status=CONFIRMED).count() == totalinstances.count()
        vulnerability = Vulnerability.objects.get(id=instance.vulnerabilityid.pk)


        if has_vulnerable:
            vulnerability.status = VULNERABLE
        elif has_accepted_risk:
            vulnerability.status = ACCEPTED_RISK
            #instance.save()
        elif has_confirm_fix:
            vulnerability.status = CONFIRMED

        vulnerability.save()



@receiver(models.signals.pre_save, sender=Project)
def update_project_status(sender, instance, **kwargs):
    if not instance.id:  # Check if it's a new project being created
        instance.status = instance.status  # Calculate status for a new project
    else:  # For existing projects, check and update status based on date change
        try:
            previous_instance = sender.objects.get(id=instance.id)
            if (previous_instance.startdate != instance.startdate or
                    previous_instance.enddate != instance.enddate):
                instance.status = instance.status  # Recalculate status if start/end date changes
        except sender.DoesNotExist:
            pass  # Ignore if the previous instance doesn't exist ( during loaddata)



@receiver(models.signals.pre_save, sender=ProjectRetest)
def update_projectretest_status(sender, instance, **kwargs):
    if not instance.id:  # Check if it's a new project retest being created
        instance.status = instance.status  # Calculate status for a new project
    else:  # For existing projects status, check and update status based on date change
        try:
            previous_instance = sender.objects.get(id=instance.id)
            if (previous_instance.startdate != instance.startdate or
                    previous_instance.enddate != instance.enddate):
                instance.status = instance.status  # Recalculate status if start/end date changes
        except sender.DoesNotExist:
            pass  # Ignore if the previous instance doesn't exist ( during loaddata)
