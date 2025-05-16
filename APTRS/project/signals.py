from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
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

            # Only recalculate status if dates changed and status is not manually set
            if ((previous_instance.startdate != instance.startdate or
                 previous_instance.enddate != instance.enddate) and
                instance.status != 'Completed' and instance.status != 'On Hold'):

                # Check if there are active retests for this project
                active_retests_exist = ProjectRetest.objects.filter(
                    project=instance,
                    is_active=True,
                    is_completed=False
                ).exists()

                # Only recalculate if there are no active retests
                # Active retests will control the status through their own signals
                if not active_retests_exist:
                    instance.status = instance.calculate_status
        except sender.DoesNotExist:
            pass  # Ignore if the previous instance doesn't exist (during loaddata)

@receiver(models.signals.pre_save, sender=ProjectRetest)
def update_projectretest_status(sender, instance, **kwargs):
    if not instance.id:  # New retest being created
        # Make sure we set the default values for new fields
        if not hasattr(instance, 'is_active') or instance.is_active is None:
            instance.is_active = True
        if not hasattr(instance, 'is_completed') or instance.is_completed is None:
            instance.is_completed = False
    else:  # Existing retest being updated
        try:
            previous_instance = sender.objects.get(id=instance.id)

            # If dates changed or active/completion status changed, update project status
            if (previous_instance.startdate != instance.startdate or
                    previous_instance.enddate != instance.enddate or
                    previous_instance.is_active != instance.is_active or
                    previous_instance.is_completed != instance.is_completed):

                # Ensure we update the project status after saving this retest
                # This is done in the post_save signal so we have the latest retest state
                pass

        except sender.DoesNotExist:
            pass  # Ignore if previous instance doesn't exist (during loaddata)

@receiver(models.signals.post_save, sender=ProjectRetest)
def update_project_after_retest_change(sender, instance, **kwargs):
    """
    Updates project status after a retest is saved or updated.
    This ensures the project status reflects the latest retest state.
    """
    try:
        project = instance.project

        # If retest is active and not completed, it should influence project status
        if instance.is_active and not instance.is_completed:
            # Calculate status based on retest dates
            current_date = timezone.now().date()

            if current_date < instance.startdate:
                project.status = 'Upcoming'
            elif instance.startdate <= current_date <= instance.enddate:
                project.status = 'In Progress'
            elif current_date > instance.enddate:
                project.status = 'Delay'

            project.save(update_fields=['status'])

        # If retest was completed or made inactive, check if other active retests exist
        elif instance.is_completed or not instance.is_active:
            other_active_retests = ProjectRetest.objects.filter(
                project=project,
                is_active=True,
                is_completed=False
            ).exclude(id=instance.id).exists()

            if not other_active_retests:
                # If this was the only active retest and it's now completed/inactive,
                # the project status should revert to its original state or to "Completed"
                if instance.is_completed:
                    project.status = 'Completed'
                else:
                    # Recalculate based on project dates
                    project.status = project.calculate_status

                project.save(update_fields=['status'])
    except Project.DoesNotExist:
        pass  # Ignore if project doesn't exist
