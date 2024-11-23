from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """
    This configuration is not required anymore, Should be removed with final release
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
