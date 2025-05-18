import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from datetime import datetime
from functools import wraps

from project.models import Project, ProjectRetest
from accounts.models import CustomUser, CustomGroup

logger = logging.getLogger(__name__)



def email_enabled_check(func):
    """
    Decorator to check if email sending is enabled in settings.
    If USE_EMAIL is False in settings, the function will log a message and return True
    without actually sending the email.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        USE_EMAIL = settings.USE_EMAIL
        if USE_EMAIL == "False":
            subject = kwargs.get('subject', 'unknown')
            recipients = kwargs.get('to_recipients', [])
            logger.info(f"Email sending disabled: '{subject}' to {recipients} was not sent due to USE_EMAIL=False")
            return True
        # If enabled, proceed with the original function
        return func(*args, **kwargs)
    return wrapper




def _get_entity_data(entity_id, is_retest):
    """
    Get project/retest data with optimized queries.

    Args:
        entity_id (int): ID of the project or retest
        is_retest (bool): Flag to indicate if this is a retest

    Returns:
        tuple: (project, retest, entity_name, entity_type, completion_date, company)
    """
    try:
        if is_retest:
            # Only fetch the necessary fields
            retest = ProjectRetest.objects.select_related(
                'project',
                'project__companyname'
            ).get(id=entity_id)

            project = retest.project
            entity_name = f"Re-audit for {project.name}"
            entity_type = "retest"
            completion_date = retest.enddate.strftime('%B %d, %Y') if retest.enddate else 'N/A'
        else:
            # Only fetch the necessary fields
            project = Project.objects.select_related(
                'companyname'
            ).get(id=entity_id)

            retest = None
            entity_name = project.name
            entity_type = "project"
            completion_date = project.enddate.strftime('%B %d, %Y') if project.enddate else 'N/A'

        company = project.companyname
        if not company:
            logger.warning(f"No company associated with {'Retest' if is_retest else 'Project'} ID: {entity_id}")
            return None

        return project, retest, entity_name, entity_type, completion_date, company

    except (Project.DoesNotExist, ProjectRetest.DoesNotExist) as e:
        logger.error(f"{'Retest' if is_retest else 'Project'} with ID {entity_id} not found: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error retrieving entity data: {str(e)}")
        raise


def _get_recipients_data(company, project, retest=None, is_retest=False):
    """
    Get email recipients data - only collecting email addresses.

    Args:
        company: The company object
        project: The project object
        retest: The retest object (if applicable)
        is_retest (bool): Flag to indicate if this is a retest

    Returns:
        tuple: (to_recipients, cc_recipients, project_manager_info)
    """
    try:
        # TO Recipients: All users from the customer company
        to_recipients = list(CustomUser.objects.filter(
            company=company,
            is_active=True
        ).values_list('email', flat=True))

        if not to_recipients:
            logger.warning(f"No active users found for company {company.name}")
            return None, None, None

        # CC Recipients: Project owners + Project Manager group users + Retest owners (if applicable)
        cc_recipients = set()

        # Simplified project manager info - only need basic info for context
        pm_info = {
            'name': "Your Project Manager",
            'email': "support@aptrs.com",
            'phone': "N/A"
        }

        # Add project owners' emails only
        project_owner_emails = list(project.owner.all().values_list('email', flat=True))
        cc_recipients.update(project_owner_emails)

        # Get first project owner's email for project manager contact in email template
        if project_owner_emails:
            pm_info['email'] = project_owner_emails[0]

        # Add retest owners' emails if this is a retest notification
        if is_retest and retest:
            retest_owner_emails = list(retest.owner.all().values_list('email', flat=True))
            cc_recipients.update(retest_owner_emails)

        # Add all Project Manager group users' emails
        try:
            pm_group = CustomGroup.objects.get(name='Project Manager')
            pm_users = CustomUser.objects.filter(
                groups=pm_group,
                is_active=True
            ).values_list('email', flat=True)

            cc_recipients.update(pm_users)
        except CustomGroup.DoesNotExist:
            logger.warning("Project Manager group does not exist")

        # Filter out None values and convert to list
        cc_recipients = list(filter(None, cc_recipients))

        return to_recipients, cc_recipients, pm_info

    except Exception as e:
        logger.error(f"Error getting recipients data: {str(e)}")
        raise


def _get_url_data(project_id):
    """
    Prepare URL data for email notifications.

    Args:
        project_id: The project ID

    Returns:
        dict: Dictionary with URL information
    """
    # Get base URL with fallback
    base_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "#"

    # Ensure base_url starts with http:// or https://
    if base_url != "#" and not base_url.startswith(('http://', 'https://')):
        base_url = f"https://{base_url}"

    # Use direct full URL for project
    project_url = f"{base_url}/customer/project/{project_id}"

    # Logo URL
    logo_url = f"{base_url}/static/images/logo.png" if base_url != "#" else "#"

    return {
        'base_url': base_url,
        'project_url': project_url,
        'logo_url': logo_url
    }

@email_enabled_check
def _send_email_notification(subject, template_name, context, to_recipients, cc_recipients):
    """
    Render template and send email notification.

    Args:
        subject (str): Email subject
        template_name (str): Template file name
        context (dict): Template context
        to_recipients (list): List of 'to' email addresses
        cc_recipients (list): List of 'cc' email addresses

    Returns:
        bool: True if sending was successful, False otherwise
    """
    try:
        # Render HTML email template
        html_message = render_to_string(f'email/{template_name}', context)

        # Create plain text version for email clients that don't support HTML
        plain_message = strip_tags(html_message)

        # Send email with CC recipients
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to_recipients,
            cc=cc_recipients,
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)

        # Log success
        logger.info(f"Email '{subject}' sent successfully")
        logger.info(f"TO recipients: {to_recipients}")
        logger.info(f"CC recipients: {cc_recipients}")
        logger.info(f"Project URL: {context.get('project_url', '')}")

        return True

    except Exception as e:
        logger.error(f"Error sending email notification: {str(e)}")
        return False


def send_completion_notification(entity_id, is_retest):
    """
    Sends a completion notification email for either a project or a retest.

    Args:
        entity_id (int): ID of the project or retest
        is_retest (bool): Flag to indicate if this is a retest completion (True) or project completion (False)

    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    logger.info(f"Sending {'retest' if is_retest else 'project'} completion email for ID: {entity_id}")
    try:
        # Get entity data
        entity_data = _get_entity_data(entity_id, is_retest)
        if not entity_data:
            return False

        project, retest, entity_name, entity_type, completion_date, company = entity_data

        # Get recipients
        recipients_data = _get_recipients_data(company, project, retest, is_retest)
        if not recipients_data[0]:  # No TO recipients
            return False

        to_recipients, cc_recipients, _ = recipients_data

        # Get URLs
        url_data = _get_url_data(project.id)

        # Create email subject
        subject = f"{'Re-audit' if is_retest else 'Project'} Completion: {entity_name}"

        # Prepare context for email template
        context = {
            'project': project,
            'retest': retest,
            'company_name': company.name,
            'project_name': project.name,
            'entity_name': entity_name,
            'entity_type': entity_type,
            'is_retest': is_retest,
            'completion_date': completion_date,
            'application_url': url_data['base_url'],
            'project_url': url_data['project_url'],
        }

        # Send email
        return _send_email_notification(
            subject=subject,
            template_name='Project-Complete.html',
            context=context,
            to_recipients=to_recipients,
            cc_recipients=cc_recipients
        )

    except (Project.DoesNotExist, ProjectRetest.DoesNotExist):
        logger.error(f"{'Retest' if is_retest else 'Project'} with ID {entity_id} not found when sending completion email")
        return False
    except Exception as e:
        logger.error(f"Error sending {'retest' if is_retest else 'project'} completion email for ID {entity_id}: {str(e)}")
        return False


def send_hold_notification(entity_id, is_retest):
    """
    Sends a hold notification email for either a project or a retest.

    Args:
        entity_id (int): ID of the project or retest
        is_retest (bool): Flag to indicate if this is a retest (True) or project (False)

    Returns:
        bool: True if the email was sent successfully, False otherwise
    """
    logger.info(f"Sending {'retest' if is_retest else 'project'} hold notification email for ID: {entity_id}")
    try:
        # Get entity data
        entity_data = _get_entity_data(entity_id, is_retest)
        if not entity_data:
            return False

        project, retest, entity_name, entity_type, _, company = entity_data

        # Get recipients
        recipients_data = _get_recipients_data(company, project, retest, is_retest)
        if not recipients_data[0]:  # No TO recipients
            return False

        to_recipients, cc_recipients, pm_info = recipients_data

        # Get URLs
        url_data = _get_url_data(project.id)

        # Get the hold reason from the project model
        hold_reason = project.hold_reason or "Not specified"

        # Default values for fields that might not be in the model
        action_needed = "Please contact your project manager for more details."
        estimated_resume_date = "To be determined"
        revised_end_date = "To be determined"

        # Get today's date for hold_date
        hold_date = datetime.now().strftime('%B %d, %Y')

        # Create email subject
        subject = f"{'Re-audit' if is_retest else 'Project'} On Hold: {entity_name}"

        # Prepare context for email template
        context = {
            'project': project,
            'retest': retest,
            'company_name': company.name,
            'project_name': project.name,
            'entity_name': entity_name,
            'entity_type': entity_type,
            'is_retest': is_retest,
            'project_url': url_data['project_url'],
            'hold_date': hold_date,
            'hold_reason': hold_reason,
            'action_needed': action_needed,
            'estimated_resume_date': estimated_resume_date,
            'revised_end_date': revised_end_date,
            'project_manager': pm_info['name'],
            'manager_email': pm_info['email'],
            'manager_phone': pm_info['phone'],
            'logo_url': url_data['logo_url'],
            'recipient_email': ", ".join(to_recipients),
        }

        # Send email
        return _send_email_notification(
            subject=subject,
            template_name='Project-Hold.html',
            context=context,
            to_recipients=to_recipients,
            cc_recipients=cc_recipients
        )

    except (Project.DoesNotExist, ProjectRetest.DoesNotExist):
        logger.error(f"{'Retest' if is_retest else 'Project'} with ID {entity_id} not found when sending hold notification email")
        return False
    except Exception as e:
        logger.error(f"Error sending {'retest' if is_retest else 'project'} hold notification email for ID {entity_id}: {str(e)}")
        return False


# Keep the original function name for backward compatibility
def send_project_completion_email(project_id):
    """
    Legacy function for backward compatibility.
    Now calls send_completion_notification with is_retest=False.
    """
    return send_completion_notification(project_id, is_retest=False)

