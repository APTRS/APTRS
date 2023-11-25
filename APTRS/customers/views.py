from django.shortcuts import render
from .models import Company, Customer
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse, HttpResponseRedirect
from django.core.files.storage import FileSystemStorage
from django.conf import settings
import os
from django.contrib import messages
from django.http import HttpResponse

from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def company(request):

    company = Company.objects.all()
    return render(request, "Company/Company.html", {'company': company})

@login_required
def delete(request):
    if request.method =='GET':
        companyid = request.GET['companyid']
        try:

            
            Company.objects.get(pk=companyid).delete()
            return HttpResponse(status=200)
            
            #responseData = {'status': 'Success'}

            #return JsonResponse(responseData)
        except ObjectDoesNotExist:
            responseData = {'status': 'Fail'}
            return JsonResponse(responseData)



@login_required
def edit(request):
    if request.method == 'GET':
        company = request.GET['company']

        try:
            company = Company.objects.get(pk=company)
            return render(request, "Company/EditCompany.html", {'company': company})
        except ObjectDoesNotExist:
            responseData = {'status': 'Fail to retrive data'}
            return JsonResponse(responseData)
    
    elif request.method =='POST':
        company = request.POST['company']
        name = request.POST['name']
        address = request.POST['address']
        print(type(company))
        if company == "":
            responseData = {'status': 'Fail to update data'}
            return JsonResponse(responseData)
        else:
            try:
                companyobject = Company.objects.get(pk=company)
                companyobject.name = name
                companyobject.address = address
                companyobject.save()

                if 'image' in request.FILES:
                    upload = request.FILES['image']
                    path = os.path.join(settings.MEDIA_ROOT, 'company')
                    
                    fss = FileSystemStorage(location=path, base_url=path)
                    file = fss.save(upload.name, upload)
                    file_url = fss.url(file)

                    
                    companyobject.img = os.path.join('company', file_url)
                    companyobject.save()
                messages.info(request,'Company Updated successfully')
      
                return HttpResponseRedirect(request.path_info + "?company="+ company)
                #return HttpResponseRedirect(request.path_info + "?company="+ company)
                    

                

            except ObjectDoesNotExist:
                responseData = {'status': 'Fail to update data'}
                return JsonResponse(responseData)




@login_required
def add(request):
    if request.method == 'GET':
        return render(request, "Company/AddCompany.html")

    elif request.method =='POST':
        name = request.POST['name']
        address = request.POST['address']
        customer = Company(name=name,address=address)
        customer.save()
        if 'image' in request.FILES:
            upload = request.FILES['image']
            path = os.path.join(settings.MEDIA_ROOT, 'company')
                    
            fss = FileSystemStorage(location=path, base_url=path)
            file = fss.save(upload.name, upload)
            file_url = fss.url(file)
            customer.img =  os.path.join('company', file_url)
            customer.save()
        company = Company.objects.all()
        return render(request, "Company/Company.html", {'company': company})



@login_required
def customer(request):

    customer = Customer.objects.all()
    return render(request, "Customer/Customer.html", {'customer': customer})


@login_required
def customerdelete(request):
    if request.method =='GET':
        customerid = request.GET['customerid']
        try:
            Customer.objects.get(pk=customerid).delete()
            return HttpResponse(status=200)

        except ObjectDoesNotExist:
            responseData = {'status': 'Fail'}
            return JsonResponse(responseData)

@login_required
def customeredit(request):
    if request.method == 'GET':
        customer = request.GET['customer']

        try:
            customer = Customer.objects.get(pk=customer)
            company = Company.objects.all().values('name')
            return render(request, "Customer/EditCustomer.html", {'customer': customer, 'company': company})
        except ObjectDoesNotExist:
            responseData = {'status': 'Fail to retrive data'}
            return JsonResponse(responseData)

    elif request.method =='POST':

        company = request.POST['company']
        customername = request.POST['name']
        email = request.POST['email']
        number = request.POST['Number']
        customer = request.POST['customer']
        

        company = Company.objects.get(name=company)

        customerobject = Customer.objects.get(pk=customer)
        customerobject.company = company
        customerobject.name = customername
        customerobject.email = email 
        customerobject.phoneNumber = number
        customerobject.save()
        messages.info(request,'Customer Updated successfully')
        #return HttpResponseRedirect(request.path_info)
        return HttpResponseRedirect(request.path_info + "?customer="+ customer)


@login_required
def customeradd(request):
    if request.method == 'GET':
        company = Company.objects.all().values('name')
        return render(request, "Customer/AddCustomer.html", {'company': company})

    elif request.method =='POST':

        company = request.POST['company']
        customername = request.POST['name']
        email = request.POST['email']
        number = request.POST['Number']
        
        company = Company.objects.get(name=company)


        customeradd = Customer(company=company,name=customername, email=email, phoneNumber=number)
        customeradd.save()

        customer = Customer.objects.all()
        
        return render(request, "Customer/Customer.html", {'customer': customer})