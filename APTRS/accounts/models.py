from django.db import models
from django.contrib.auth.models import User
from django.dispatch import receiver 
from django.db.models.signals import post_save 
from phonenumber_field.modelfields import PhoneNumberField
from django.conf import settings

# Create your models here.

defaultcompany = settings.ORG #getattr(settings, "ORG")

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE,related_name='userprofile',null=True)
    profilepic = models.ImageField(default='profile/avatar-1.svg', upload_to='profile')
    number = PhoneNumberField(unique = True,blank = False, null=True, default=None)
    company = models.CharField(max_length=300,default=settings.ORG)

    
    def __str__(self):
        return self.user.username
    '''
    @receiver(post_save, sender=User) 
    def create_user_profile(sender, instance, created, **kwargs):

        if created:
        # Check if a profile already exists for this user
            if not hasattr(instance, 'userprofile'):
                Profile.objects.create(user=instance, company=settings.ORG)

    @receiver(post_save, sender=User)
    def save_user_profile(sender, instance, **kwargs):
        instance.userprofile.save()
    '''