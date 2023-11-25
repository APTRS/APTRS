from django.db import models
from django.contrib.auth.models import User


# Create your models here.


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE,related_name='userprofile',null=True)
    profilepic = models.ImageField(default='profile/avatar-1.jpg', upload_to='profile')
    number =models.IntegerField()
    company = models.CharField(max_length=300)

    
    def __str__(self):
        return self.user.username
    
