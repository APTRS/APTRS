from django.shortcuts import render
from .models import Project, Vulnerability, Vulnerableinstance
from customers.models import Company, Customer
from vulnerability.models import VulnerabilityDB
from datetime import datetime
from django.http import HttpResponse
from django.contrib import messages
from django.http import JsonResponse, HttpResponseRedirect
from .forms import ProjectVulnerabilityForm
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.decorators import login_required
from io import BytesIO
from django.template.loader import get_template
from django.conf import settings
import os
import pdfkit
import PyPDF2
from PyPDF2 import PdfFileWriter
from accounts.models import Profile


@login_required
def project(request):

    project = Project.objects.all()
    return render(request, "Project/project.html",{'project': project})

@login_required
def projectadd(request):
    if request.method == 'GET':

        company = Company.objects.all().values('name')
        return render(request, "Project/projectadd.html", {'company': company})
        
    elif request.method == 'POST':
        company = request.POST['company']
        projectname = request.POST['projectname']
        projectdescription = request.POST['projectdescription']
        scope = request.POST['scope']
        projecttype = request.POST['projecttype']
        startname = request.POST['startname']
        enddate = request.POST['enddate']
        startname = datetime.strptime(startname, '%d/%m/%Y').strftime('%Y-%m-%d')
        enddate = datetime.strptime(enddate, '%d/%m/%Y').strftime('%Y-%m-%d')


        company = Company.objects.get(name=company)

        projectadd = Project(companyname=company,name=projectname, scope=scope, description=projectdescription,projecttype=projecttype,startdate=startname,enddate=enddate)
        projectadd.save()

        project = Project.objects.all()
        return render(request, "Project/project.html",{'project': project})



@login_required
def projectdelete(request, pk):
    Project.objects.get(pk=pk).delete()
    return HttpResponse(status=200)


@login_required
def projectView(request,pk):
    if request.method == 'GET':

        project =  Project.objects.get(pk=pk)
        vulnerability = Vulnerability.objects.filter(project=pk)
        
        return render(request, "Project/Project-Details.html", {'vulnerability': vulnerability, 'project': project})

@login_required
def projectedit(request,pk):
    if request.method == 'POST':
        projectname = request.POST['projectname']
        projectdescription = request.POST['projectdescription']
        scope = request.POST['scope']
        projecttype = request.POST['projecttype']
        startname = request.POST['startname']
        enddate = request.POST['enddate']


        startname = datetime.strptime(startname, '%d/%m/%Y').strftime('%Y-%m-%d')
        enddate = datetime.strptime(enddate, '%d/%m/%Y').strftime('%Y-%m-%d')
        
        project = Project.objects.get(pk=pk)
        project.name = projectname
        project.description = projectdescription
        project.scope = scope 
        project.projecttype = projecttype
        project.startdate = startname
        project.enddate = enddate
        project.save()
        messages.info(request,'Project Updated successfully')
        return HttpResponseRedirect('/project/'+pk+'/')

@login_required
def projectvulndelete(request,pk):
    Vulnerability.objects.get(pk=pk).delete()
    return HttpResponse(status=200)

@login_required
@csrf_exempt
def projectnewvuln(request,pk):
    form = ProjectVulnerabilityForm()
    if request.method == 'GET':
        vulnerabilityDB = VulnerabilityDB.objects.all().values('vulnerabilityname')
        context = {'form':form,'vulnerabilityDB': vulnerabilityDB,'project':pk}
        return render(request, "Project/newvulnerability.html", context)
    
    if request.method == 'POST':
        
        vulntitle = request.POST.get('vulnerabilityname')
        
        form = ProjectVulnerabilityForm(request.POST)
        
        if form.is_valid():
            
            responseid = form.save()
            responseData = {'Vulnerability': responseid.id,'Status':'Success','Project':pk}
            return JsonResponse(responseData)
        else:
            print(form.errors )
            #print(form.non_field_errors )




@login_required
def fetchvuln(request):
    vulntitle = request.GET['title']
    project =  VulnerabilityDB.objects.get(vulnerabilityname=vulntitle)
    print(project.vulnerabilityseverity)
    return JsonResponse({'severity':project.vulnerabilityseverity,'Description':project.vulnerabilitydescription,'solution':project.vulnerabilitysolution,'refer':project.vulnerabilityreferlnk,'vector':project.cvssvector})

@login_required
def projecteditvuln(request,pk):
    vlun = Vulnerability.objects.get(id=pk)
    form = ProjectVulnerabilityForm(instance=vlun)
    
    if request.method == 'POST':
        form = ProjectVulnerabilityForm(request.POST, instance=vlun)
        print(form.non_field_errors())
        if form.is_valid():
            form.save()
            project = vlun.project
        
            return HttpResponse(status=200)
        else:
            print(form.errors )
            print(form.non_field_errors )
       
    if request.method == 'GET':        
        vulnerabilityDB = VulnerabilityDB.objects.all().values('vulnerabilityname')
        instances = Vulnerableinstance.objects.filter(vulnerabilityid=pk)
        context = {'form':form,'vulnerabilityDB': vulnerabilityDB,'instances':instances,'id':pk}
        
        return render(request, 'Project/Edit-Vulnerability.html', context)

@login_required
@csrf_exempt
def deleteinstace(request,pk):
    #vulnid = request.POST['id']
    Vulnerableinstance.objects.get(pk=pk).delete()
    responseData = {'status':'success'}
    return JsonResponse(responseData)



        
@login_required
@csrf_exempt
def addurl(request,pk):
    body = json.loads(request.body)
    vulnerability = Vulnerability.objects.get(id=pk)
    for index in range(len(body)):
        url =body[index]['URL']
        paramter = body[index]['Paramter']
        print(url)
        print(paramter)
        vuln = Vulnerableinstance(URL=url,Paramter=paramter,vulnerabilityid=vulnerability,project=vulnerability.project)
        vuln.save()
    insntaceid = vuln.pk
    vlun = Vulnerability.objects.get(id=pk)
    project = vlun.project
    locationid = '/project/'+str(project.id)+'/'
    responseData = {'redirect':locationid,'insntaceid':insntaceid}
    return JsonResponse(responseData)






@login_required
def pdf(request,pk):
    project = Project.objects.get(pk=pk)

    order = ['Critical', 'High', 'Medium', 'Low', 'Informational']
    vuln = Vulnerability.objects.filter(project=project)
   
    instances = Vulnerableinstance.objects.filter(project=project)
    #print(request.user.profile.company)
   
    vuln = sorted(vuln, key=lambda x: order.index(x.vulnerabilityseverity))
    ciritcal =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Critical').count()
    high =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='High').count()
    medium =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Medium').count()
    low =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Low').count()
    info =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Informational').count()
  
    customer = Customer.objects.filter(company=project.companyname)
    profile = Profile.objects.all()
    userid = request.user.id
    userdetails = Profile.objects.get(user=userid)
    #print(userdetails.company)
   
    tocstyle = (os.path.join(settings.BASE_DIR,'templates','Report','toc.xml'))
    url = request.build_absolute_uri()
    
    
    
    template = get_template('Report/Report.html')
    footerpage = (os.path.join(settings.BASE_DIR,'templates','Report','Footer.html'))
    content = {'vuln':vuln,'project':project,"settings":settings} 
    
    cover = get_template('Report/cover.html')
    bgimage = (os.path.join(settings.BASE_DIR,'assets','images','BG.jpg'))
    coverpage = cover.render({'project':project,"settings":settings,'bgimage':bgimage})
    
    
    pdfpage = template.render({'vuln':vuln,'project':project,"settings":settings,"url":url,'userdetails':userdetails,'profile':profile,'customer':customer,'ciritcal':ciritcal,'high':high,'medium':medium,'low':low,'info':info,'instances':instances})
    pdfpageoptions = {'javascript-delay':'800','margin-left': '0','margin-right': '0','margin-top': '10','margin-bottom': '7','enable-local-file-access': '','footer-font-name':'Segoe UI','enable-javascript':'','footer-html':footerpage}
    pdfpagepdf = pdfkit.from_string(pdfpage,"reportpage.pdf",pdfpageoptions,cover = coverpage,cover_first=True,toc={"toc-header-text": "Table of Contents",'xsl-style-sheet':tocstyle,'disable-dotted-lines':''})
    
    

   
    options = {'margin-left': '0','margin-right': '0','margin-top': '0','margin-bottom': '0','enable-local-file-access': '','footer-font-name':'Segoe UI','enable-javascript':''}
    pdf = pdfkit.from_string(coverpage, 'coverpage.pdf',options)
    


    pdfWriter = PyPDF2.PdfFileWriter()
    pdf1Reader = PyPDF2.PdfReader('coverpage.pdf')
    pdf2Reader = PyPDF2.PdfReader('reportpage.pdf')
    #print(pdf1Reader)
    pageObj = pdf1Reader.getPage(0)
    pdfWriter.addPage(pageObj)
    for pageNum in range(pdf2Reader.numPages):
        if not pageNum == 0:
            pageObj = pdf2Reader.getPage(pageNum)
       
            pdfWriter.addPage(pageObj)
    response_bytes_stream = BytesIO()
    pdfWriter.write(response_bytes_stream)
    os.remove('coverpage.pdf')
    os.remove('reportpage.pdf')
    filename = project.projecttype + " Report of " + project.name+".pdf"
    response = HttpResponse(response_bytes_stream.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'inline; filename={filename}'

    return response 