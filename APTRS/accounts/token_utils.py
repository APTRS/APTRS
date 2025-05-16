import logging
import uuid
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import CustomerInvitation, CustomUser
from utils.email_notification import email_enabled_check
logger = logging.getLogger(__name__)


def generate_token(user, token_type='invitation'):
    """
    Generate a token (either invitation or password reset) for a user.
    
    Args:
        user (CustomUser): The user to generate a token for
        token_type (str): The type of token ('invitation' or 'password_reset')
        
    Returns:
        CustomerInvitation: The token object
    """
    with transaction.atomic():
        # Delete any existing tokens of the same type for this user
        CustomerInvitation.objects.filter(user=user, token_type=token_type).delete()
        
        # Create a new token
        token_obj = CustomerInvitation.objects.create(
            user=user,
            token_type=token_type
        )
        
        return token_obj


def validate_token(token_str):
    """
    Unified function to validate any type of token (invitation or password reset).
    
    Args:
        token_str (str): The token string to validate
        
    Returns:
        tuple: (is_valid, user, token_obj, message, token_type)
            - is_valid (bool): Whether the token is valid
            - user (CustomUser): The associated user, or None if invalid
            - token_obj (CustomerInvitation): The token object, or None if invalid
            - message (str): A message explaining the result
            - token_type (str): The type of token ('invitation' or 'password_reset')
    """
    if not token_str:
        return False, None, None, "No token provided.", None
        
    try:
        # Try parsing the token as UUID
        token_uuid = uuid.UUID(token_str)
        
        # Get the token object
        token_obj = CustomerInvitation.objects.get(token=token_uuid)
        token_type = token_obj.token_type
        
        # Check if the token is expired
        if timezone.now() > token_obj.expires_at:
            if token_type == 'invitation':
                message = "This invitation has expired."
            else:
                message = "This password reset link has expired."
            return False, None, token_obj, message, token_type
        
        # Check if the token is already used
        if token_obj.is_used:
            if token_type == 'invitation':
                message = "This invitation has already been used."
            else:
                message = "This password reset link has already been used."
            return False, None, token_obj, message, token_type
        
        # Verify that the user still exists and is valid
        user = token_obj.user
        if not user:
            return False, None, token_obj, "User associated with this token no longer exists.", token_type
            
        return True, user, token_obj, "Valid token.", token_type
        
    except ValueError:
        # Not a valid UUID
        return False, None, None, "Invalid token format.", None
    except CustomerInvitation.DoesNotExist:
        return False, None, None, "Invalid token.", None
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        return False, None, None, "An error occurred while validating the token.", None


def process_token(token_str, password):
    """
    Unified function to process any type of token (accept invitation or reset password).
    
    Args:
        token_str (str): The token string to process
        password (str): The new password to set
        
    Returns:
        tuple: (success, user, message, token_type)
            - success (bool): Whether the operation was successful
            - user (CustomUser): The user object if successful, None otherwise
            - message (str): A message explaining the result
            - token_type (str): The type of token that was processed
    """
    is_valid, user, token_obj, message, token_type = validate_token(token_str)
    
    if not is_valid:
        return False, None, message, token_type
    
    try:
        with transaction.atomic():
            # Set the user's password
            user.set_password(password)
            
            # For invitations, ensure the user is active
            if token_type == 'invitation':
                user.is_active = True
                
            user.save()
            
            # Delete the token
            token_obj.delete()
            
            if token_type == 'invitation':
                logger.info(f"Invitation accepted for user {user.email}")
                message = "Password set successfully."
            else:
                logger.info(f"Password reset completed for user {user.email}")
                message = "Password reset successfully."
            
            return True, user, message, token_type
    
    except Exception as e:
        error_msg = f"Error processing token: {str(e)}"
        logger.error(error_msg)
        return False, None, error_msg, token_type

@email_enabled_check
def send_token_email(user, token_type='invitation'):
    """
    Send an email with a token (invitation or password reset) to a user.
    
    Args:
        user (CustomUser): The user to send the email to
        token_type (str): The type of token ('invitation' or 'password_reset')
        
    Returns:
        tuple: (success, token_obj or error_msg)
            - success (bool): Whether the email was sent successfully
            - token_obj or error_msg: The token object if successful, error message if failed
    """
    try:
        # Generate token
        token_obj = generate_token(user, token_type)
        token = token_obj.token
        
        # Construct URL
        base_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:3000"
        if not base_url.startswith(('http://', 'https://')):
            base_url = f"https://{base_url}"
        
        # Different URL paths for different token types
        if token_type == 'invitation':
            url_path = f"{base_url}/set-password/{token}"
            template_name = 'email/customer-invitation.html'
            subject = f"Invitation to join APTRS - {user.company.name if user.company else 'Your Organization'}"
        else:  # password_reset
            url_path = f"{base_url}/reset-password/{token}"
            template_name = 'email/password-reset.html'
            subject = "Reset Your APTRS Password"
            
        # Prepare email context
        context = {
            'user': user,
            'company_name': user.company.name if hasattr(user, 'company') and user.company else "Your Organization",
            'invitation_url': url_path if token_type == 'invitation' else None,
            'reset_url': url_path if token_type == 'password_reset' else None,
            'expiry_hours': 24,
        }
        
        # Render email template
        html_message = render_to_string(template_name, context)
        plain_message = strip_tags(html_message)
        
        # Send email
        email = EmailMultiAlternatives(
            subject=subject,
            body=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        email.attach_alternative(html_message, "text/html")
        email.send(fail_silently=False)
        
        logger.info(f"{'Invitation' if token_type == 'invitation' else 'Password reset'} email sent to {user.email}")
        
        
    except Exception as e:
        error_msg = f"Error sending {'invitation' if token_type == 'invitation' else 'password reset'} email: {str(e)}"
        logger.error(error_msg)
    


def send_invitation_email(email, token_type):

    try:
        user = CustomUser.objects.get(email=email)
        send_token_email(user, token_type='password_reset')
            
    except CustomUser.DoesNotExist:
        logger.info(f"Password reset requested for non-existent email: {email}")
       