from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length=300,unique = True)
    img = models.ImageField(upload_to='company')
    address = models.TextField()


'''
class Customer(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, null = False, blank = False, default=None)
    email = models.EmailField(max_length=300, unique = True, null = False, blank = False, default=None)
    phoneNumber = PhoneNumberField(unique = True, null = False, blank = False, default=None)
    position = models.CharField(max_length=100, null = True, blank = True, default=None)

    class Meta:
        unique_together = (("company", "name"),)

'''