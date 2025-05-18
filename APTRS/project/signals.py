from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Project, Vulnerability, Vulnerableinstance, ProjectRetest
from utils.project_status import update_project_status
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
        totalinstances = Vulnerableinstance.objects.filter(vulnerabilityid=instance.pk)

        has_vulnerable = totalinstances.filter(status=VULNERABLE).exists()
        has_accepted_risk = totalinstances.filter(status=ACCEPTED_RISK).exists()
        has_confirm_fix = totalinstances.filter(status=CONFIRMED).count() == totalinstances.count()

        try:
            original_instance = Vulnerability.objects.get(pk=instance.pk)
            original_status = original_instance.status
        except Vulnerability.DoesNotExist:
            original_status = None

        status_changed = False
        if has_vulnerable:
            if instance.status != VULNERABLE:
                status_changed = True
            instance.status = VULNERABLE
        elif has_accepted_risk:
            if instance.status != ACCEPTED_RISK:
                status_changed = True
            instance.status = ACCEPTED_RISK
        elif has_confirm_fix:
            if instance.status != CONFIRMED:
                status_changed = True
            instance.status = CONFIRMED

            # Set fixed_date when changing to CONFIRMED status
            if hasattr(instance, 'fixed_date'):
                if original_status != CONFIRMED and not instance.fixed_date:
                    instance.fixed_date = timezone.now()

        # If status is changed from CONFIRMED to something else, clear fixed_date
        if hasattr(instance, 'fixed_date') and original_status == CONFIRMED and instance.status != CONFIRMED:
            instance.fixed_date = None

        # Use update() to avoid triggering this signal again
        if status_changed:
            fields_to_update = ['status']
            if hasattr(instance, 'fixed_date'):
                fields_to_update.append('fixed_date')

            # Use save to update fields properly
            instance.save(update_fields=fields_to_update)

@receiver(post_save, sender=Vulnerableinstance)
def update_vulnerableinstance(sender, instance, created, **kwargs):
    if not created:
        totalinstances = Vulnerableinstance.objects.filter(vulnerabilityid=instance.vulnerabilityid.pk)

        has_vulnerable = totalinstances.filter(status=VULNERABLE).exists()
        has_accepted_risk = totalinstances.filter(status=ACCEPTED_RISK).exists()
        has_confirm_fix = totalinstances.filter(status=CONFIRMED).count() == totalinstances.count()
        vulnerability = Vulnerability.objects.get(id=instance.vulnerabilityid.pk)

        # Store original status to detect changes
        original_status = vulnerability.status

        if has_vulnerable:
            vulnerability.status = VULNERABLE
        elif has_accepted_risk:
            vulnerability.status = ACCEPTED_RISK
        elif has_confirm_fix:
            vulnerability.status = CONFIRMED
            # Set fixed_date if status is changing to CONFIRMED and no fixed_date already set
            if original_status != CONFIRMED and not vulnerability.fixed_date:
                vulnerability.fixed_date = timezone.now()

        # Clear fixed_date if status is changing from CONFIRMED to something else
        if original_status == CONFIRMED and vulnerability.status != CONFIRMED:
            vulnerability.fixed_date = None

        print(vulnerability.fixed_date)

        vulnerability.save()

@receiver(models.signals.pre_save, sender=Project)
def update_project_status(sender, instance, **kwargs):
    # For new projects, just use the calculated status (based on dates)
    if not instance.id:
        instance.status = instance.calculate_status
    else:
        try:
            previous_instance = sender.objects.get(id=instance.id)

            update_project_status(previous_instance)
        except sender.DoesNotExist:
            pass  # Ignore if the previous instance doesn't exist (during loaddata)


@receiver(models.signals.post_save, sender=ProjectRetest)
def update_project_after_retest_change(sender, instance, **kwargs):
    """
    Updates project status after a retest is saved or updated.
    This ensures the project status reflects the latest retest state.
    """
    try:
        project = instance.project

        update_project_status(project)
    except Project.DoesNotExist:
        pass  # Ignore if project doesn't exist
