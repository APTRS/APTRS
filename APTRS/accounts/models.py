from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

class CustomPermission(models.Model):
    """Custom permission model."""
    name = models.CharField(max_length=100,unique=True)
    description = models.TextField()

    def __str__(self):
        return self.name

class CustomGroup(models.Model):
    """Custom group model."""
    #group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='custom_group')
    #name = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='custom_group')
    #group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='custom_group')
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
