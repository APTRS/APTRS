from datetime import timedelta
import logging
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken

logger = logging.getLogger(__name__)

def create_image_access_token(user):
    """
    Create a Simple JWT token for image access.

    Args:
        user: The user for whom to create the token

    Returns:
        str: The JWT token string
    """
    try:
        refresh = RefreshToken.for_user(user)
        refresh['allow_image_access'] = True
        access_token = refresh.access_token

        access_token.set_exp(lifetime=timedelta(minutes=30))
        token = str(access_token)
        return token

    except Exception as e:
        logger.error(f"Error creating image access token: {e}")
        return None

def verify_image_access_token(token):
    """
    Verify an image access token.

    Args:
        token (str): The JWT token to verify

    Returns:
        bool: Whether the token is valid and has image access permission
    """
    if not token:
        return False

    try:
        # Load the token to validate it
        access_token = AccessToken(token)

        # Validation is automatic - if we get here, the token is valid
        # Now check if it has the required permission
        if not access_token.get('allow_image_access', False):
            logger.warning("Token does not have image access permission")
            return False

        return True
    except Exception as e:
        # This will catch any validation errors, expiration, etc.
        logger.warning(f"Token validation failed: {e}")
        return False