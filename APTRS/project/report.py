from io import BytesIO
import os
import pdfkit
import PyPDF2
from PyPDF2 import PdfFileWriter
from customers.models import Company, Customer
from vulnerability.models import VulnerabilityDB
#from accounts.models import Profile
from django.shortcuts import render
from django.conf import settings

from django.template.loader import get_template
from .models import Project,Vulnerability,PrjectScope,Vulnerableinstance,ProjectRetest
from django.db.models import Q
from django.contrib.auth.models import User


#wkhtmltopdf 0.12.6.1 (with patched qt)
#wkhtmltopdf 0.12.6 (with patched qt)



def generate_pdf_report(Report_format,Report_type,pk,url,standard):
    project = Project.objects.get(pk=pk)
    Report_type = Report_type
    standard = standard
    
    
    vuln = Vulnerability.objects.filter(project=project).order_by('-cvssscore')
    instances = Vulnerableinstance.objects.filter(project=project)


    ciritcal =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Critical',status='Vulnerable').count()
    high =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='High',status='Vulnerable').count()
    medium =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Medium',status='Vulnerable').count()
    low =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Low',status='Vulnerable').count()
    info = Vulnerability.objects.filter(Q(project=project) & (Q(status='Vulnerable')) & (Q(vulnerabilityseverity='Informational') | Q(vulnerabilityseverity='None'))).count()
    totalvulnerability = Vulnerability.objects.filter(project=project).count()
    projectscope = PrjectScope.objects.filter(project=project)
    lastretest = ProjectRetest.objects.filter(project_id=pk).order_by('-id').first()
    totalretest = ProjectRetest.objects.filter(project_id=pk)

    customer = Customer.objects.filter(company=project.companyname)
    companydetails = Company.objects.get(pk=project.companyname.id)
    
    userdetails = Customer.objects.all() ## Temporary

    tocstyle = (os.path.join(settings.BASE_DIR,'templates','Report','toc.xml'))
    url = url

    template = get_template('Report/Report.html')
    footerpage = (os.path.join(settings.BASE_DIR,'templates','Report','Footer.html'))


    cover = get_template('Report/cover.html')
    bgimage = (os.path.join(settings.BASE_DIR,'assets','images','BG.jpg'))
    coverpage = cover.render({'project':project,"settings":settings,'bgimage':bgimage,'Report_type':Report_type,'lastretest':lastretest})

    pdfpage = template.render({'projectscope':projectscope,'totalvulnerability':totalvulnerability,'standard':standard,'Report_type':Report_type,'totalretest':totalretest,'vuln':vuln,'project':project,"settings":settings,"url":url,'userdetails':userdetails,'profile':userdetails,'customer':customer,'ciritcal':ciritcal,'high':high,'medium':medium,'low':low,'info':info,'instances':instances})
    pdfpageoptions = {'no-stop-slow-scripts':'','page-size':'Letter','viewport-size':'1280x1024','javascript-delay':'1000','margin-left': '0','margin-right': '0','margin-top': '15','margin-bottom': '10','enable-local-file-access': '','footer-font-name':'Segoe UI','enable-javascript':'','footer-html':footerpage}
    pdf_bytes = pdfkit.from_string(pdfpage,False,pdfpageoptions,cover = coverpage,cover_first=True,toc={"toc-header-text": "Table of Contents",'xsl-style-sheet':tocstyle,'disable-dotted-lines':''})
    
    options = {'page-size':'Letter','viewport-size':'1280x1024','margin-left': '0','margin-right': '0','margin-top': '0','margin-bottom': '0','enable-local-file-access': '','footer-font-name':'Segoe UI','enable-javascript':''}
    pdf_cover = pdfkit.from_string(coverpage, False,options)

    pdf_cover_reader = PyPDF2.PdfFileReader(BytesIO(pdf_cover))
    pdf_report_reader = PyPDF2.PdfFileReader(BytesIO(pdf_bytes))

    pdf_writer = PyPDF2.PdfFileWriter()
    pdf_writer.addPage(pdf_cover_reader.getPage(0))

    for i in range(1, pdf_report_reader.getNumPages()):
        pdf_writer.addPage(pdf_report_reader.getPage(i))


    merged_pdf_bytes = BytesIO()
    pdf_writer.write(merged_pdf_bytes)
    return merged_pdf_bytes.getvalue()
