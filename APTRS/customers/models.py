from django.db import models
from phonenumber_field.modelfields import PhoneNumberField


# Create your models here.

class Company(models.Model):
    name = models.CharField(max_length=300)
    img = models.ImageField(upload_to='company')
    address = models.TextField()



class Customer(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, unique = True, null = False, blank = False, default=None)
    email = models.EmailField(max_length=300, unique = True, null = False, blank = False, default=None)
    phoneNumber = PhoneNumberField(unique = True, null = False, blank = False, default=None)