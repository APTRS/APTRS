from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
import uuid
from django.utils import timezone
from datetime import timedelta

class CustomPermission(models.Model):
    """Custom permission model."""
    name = models.CharField(max_length=100,unique=True)
    description = models.TextField()

    def __str__(self):
        return self.name

class CustomGroup(models.Model):
    """Custom group model."""
    name = models.CharField(max_length=150, null=True, blank=True)
    list_of_permissions = models.ManyToManyField(CustomPermission, blank=True)
    description = models.CharField(max_length=150, null=True, blank=True)

    def __str__(self):
        return self.group.name or self.description

class CustomUserManager(BaseUserManager):
    """Custom manager for CustomUser model."""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model."""
    username = models.CharField(max_length=150, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    profilepic = models.ImageField(default='profile/avatar-1.svg', upload_to='profile')
    number = PhoneNumberField(unique=True, blank=False, null=True, default=None)
    date_joined = models.DateTimeField(auto_now_add=True)
    company = models.ForeignKey('customers.Company', on_delete=models.CASCADE, editable=False, null=True, blank=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    groups = models.ManyToManyField(
        CustomGroup,
        verbose_name=('groups'),
        blank=True,
        help_text=(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email



class CustomerInvitation(models.Model):
    """Store invitation tokens for customer users."""
    TOKEN_TYPES = (
        ('invitation', 'Invitation Token'),
        ('password_reset', 'Password Reset Token'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='invitations')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    token_type = models.CharField(max_length=20, choices=TOKEN_TYPES, default='invitation')

    def save(self, *args, **kwargs):
        if not self.pk:  # Only set expiry on creation
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)

    @property
    def is_valid(self):
        """Check if the invitation token is still valid."""
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"{self.get_token_type_display()} for {self.user.email}"

