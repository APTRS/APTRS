from django.shortcuts import render
from django.contrib.auth import authenticate, login,logout
from django.http import HttpResponseRedirect
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .forms import UpdateUserForm, UpdateProfileForm
from .models import Profile

from django.http import HttpResponse, JsonResponse
# Create your views here.


def Login(request):
    if request.method == 'GET':
        return render(request, "Accounts/login.html")
    
    elif request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username = username, password = password)
        if user is not None:
            login(request, user)
            return HttpResponseRedirect('/')
    

@login_required
def Logout(request):
    logout(request)
    return HttpResponseRedirect('/accounts/login')


@login_required
def profile(request,pk):
    user = User.objects.get(pk=pk)
    profile = Profile.objects.get(user=pk)
    
    user_form = UpdateUserForm(instance=user)
    
    profile_form = UpdateProfileForm(instance=profile)
    if request.method == 'POST':
        
        user_form = UpdateUserForm(request.POST, instance=user)
        profile_form = UpdateProfileForm(request.POST, request.FILES, instance=profile)
        username = request.POST['username']
        email = request.POST['email']
        number = request.POST['number']
        
        if User.objects.exclude(pk=pk).filter(username=username).exists():
            
            responseData = {'Userexist': 'True'}
            return JsonResponse(responseData)
        elif User.objects.exclude(pk=pk).filter(email=email).exists():
            
            responseData = {'Emailexist': 'True'}
            return JsonResponse(responseData)
        elif Profile.objects.exclude(user=pk).filter(number=number).exists():
            
            responseData = {'number': 'True'}
            return JsonResponse(responseData)
        else:
            

            if user_form.is_valid() and profile_form.is_valid():
                user_form.save()
                profile_form.save()
                responseData = {'Status': 'Success'}
                return JsonResponse(responseData)
            else:
                responseData = {'Status': 'Fail'}
                return JsonResponse(responseData)

    
    if request.method == 'GET':
        userdetails = User.objects.get(pk=pk)
        context = {'userform':user_form,'profileform': profile_form,'profile':profile}
        return render(request, "Accounts/profile.html",context)
    





@login_required
def setting(request):
    if request.method == 'GET':
        user = User.objects.all()
        profile = Profile.objects.all()
        context = {"user":user,"profile":profile}
        return render(request, "Accounts/setting.html",context)


@login_required
def Delete(request,pk):
    
    User.objects.get(pk=pk).delete()
    return HttpResponse(status=200)
    

@login_required
def add(request):
    if request.method == 'GET':
        profile_form = UpdateProfileForm()
        context = {'profileform': profile_form}
        
        return render(request, "Accounts/add-user.html",context)


    if request.method == 'POST':

        user_form = UpdateUserForm(request.POST)

        username = request.POST['username']
        email = request.POST['email']
        number = request.POST['number']
        fname = request.POST['first_name']
        lname = request.POST['last_name']
        password = request.POST['password']
        company = request.POST['company']
        
        if User.objects.filter(username=username).exists():
            
            responseData = {'Userexist': 'True'}
            return JsonResponse(responseData)
        elif User.objects.filter(email=email).exists():
            
            responseData = {'Emailexist': 'True'}
            return JsonResponse(responseData)
        elif Profile.objects.filter(number=number).exists():
            
            responseData = {'number': 'True'}
            return JsonResponse(responseData)
        
        else:
            usersave = User(username=username,email=email,first_name=fname,last_name=lname)
            usersave.set_password(password)
            usersave.save()
            profile_form = UpdateProfileForm(request.POST, request.FILES)
           
            profile_form.user = usersave.id
            if profile_form.is_valid():
                
                formdata = profile_form.save()
                profileid = formdata.pk
                print(profileid)
                profiledata = Profile.objects.get(pk=profileid)
                profiledata.user_id = usersave.id
                profiledata.save()
                responseData = {'Status': 'Success'}
                return JsonResponse(responseData)
            else:
                responseData = {'Status': 'Fail'}
                return JsonResponse(responseData)


