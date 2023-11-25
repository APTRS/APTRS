from django import forms

from django.contrib.auth.models import User
from .models import Profile


class UpdateUserForm(forms.ModelForm):
    username = forms.CharField(max_length=100,required=True,widget=forms.TextInput())
    email = forms.EmailField(required=True,widget=forms.TextInput())
    first_name = forms.CharField(max_length=100,required=True,widget=forms.TextInput())
    last_name = forms.CharField(max_length=100,required=True,widget=forms.TextInput())

    class Meta:
        model = User
        fields = ['username', 'email','first_name','last_name']



class UpdateProfileForm(forms.ModelForm):
    profilepic = forms.ImageField(widget=forms.FileInput(attrs={'class': 'form-control fileupload'}))
    number = forms.IntegerField(required=True,widget=forms.TextInput())
    company = forms.CharField(max_length=100,required=True,widget=forms.TextInput())

    class Meta:
        model = Profile
        fields = ['profilepic', 'number','company']