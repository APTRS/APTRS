from io import BytesIO
import os
import pdfkit
import PyPDF2
from PyPDF2 import PdfFileWriter
from customers.models import Company
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

    #customer = Customer.objects.filter(company=project.companyname)
    #companydetails = Company.objects.get(pk=project.companyname.id)
    
    #userdetails = Customer.objects.all() ## Temporary

    tocstyle = (os.path.join(settings.BASE_DIR,'templates','Report','toc.xml'))
    url = url

    template = get_template('Report/Report.html')
    footerpage = (os.path.join(settings.BASE_DIR,'templates','Report','Footer.html'))


    cover = get_template('Report/cover.html')
    bgimage = (os.path.join(settings.BASE_DIR,'assets','images','BG.jpg'))
    coverpage = cover.render({'project':project,"settings":settings,'bgimage':bgimage,'Report_type':Report_type,'lastretest':lastretest})

    pdfpage = template.render({'projectscope':projectscope,'totalvulnerability':totalvulnerability,'standard':standard,'Report_type':Report_type,'totalretest':totalretest,'vuln':vuln,'project':project,"settings":settings,"url":url,'ciritcal':ciritcal,'high':high,'medium':medium,'low':low,'info':info,'instances':instances})
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


import urllib.request
from weasyprint import default_url_fetcher, HTML

from urllib.parse import urljoin

def is_whitelisted_PATH(url):
    for path in settings.WHITE_LISTED_PATH:
        if url.startswith('file:///' + path):
            return True
    print("Blacklisted path")
    return False

def my_fetcher(url):
    if url.startswith('file://'):
        #print("Hello world")
        #print("Original URL:", url)
        alloweddir = settings.BASE_DIR
        #print("Alloweddir:", alloweddir)


        # Concatenate the provided URL with settings.BASE_DIR using urljoin
        url = 'file:///' + url.replace('file:///', str(alloweddir))

    print("Modified URL:", url)

    return default_url_fetcher(url)


from django.http import HttpResponse
from django_weasyprint import WeasyTemplateResponse
from django.template.loader import render_to_string
from django.http import HttpResponseServerError
from accounts.models import CustomUser
from weasyprint import HTML, CSS
import logging

import pygal

from pygal.style import Style

def generate_pdf_report2(Report_format,Report_type,pk,url,standard,request):

    logger = logging.getLogger('weasyprint')
    logger.addHandler(logging.FileHandler('easy.log'))

    # Get Project Details 
    project = Project.objects.get(pk=pk)
    Report_type = Report_type
    standard = standard
    
    ## Get All Projects Vulnerability filter higher to lower CVSS Score
    vuln = Vulnerability.objects.filter(project=project).order_by('-cvssscore')

    #### Get ALL Instances for the Projects  (Not using Vulnerability colum)  ### Need to optimize to speed up the HTML generation
    instances = Vulnerableinstance.objects.filter(project=project)

    internalusers = CustomUser.objects.filter(is_staff=True,is_active=True)
    customeruser = CustomUser.objects.filter(is_active=True,company=project.companyname)
    

    ### Get Total Count for each severity
    #ciritcal =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Critical',status='Vulnerable').count()
    #high =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='High',status='Vulnerable').count()
    #medium =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Medium',status='Vulnerable').count()
    #low =  Vulnerability.objects.filter(project=project,vulnerabilityseverity='Low',status='Vulnerable').count()
    #info = Vulnerability.objects.filter(Q(project=project) & (Q(status='Vulnerable')) & (Q(vulnerabilityseverity='Informational') | Q(vulnerabilityseverity='None'))).count()


    ciritcal =  vuln.filter(project=project,vulnerabilityseverity='Critical',status='Vulnerable').count()
    high =  vuln.filter(project=project,vulnerabilityseverity='High',status='Vulnerable').count()
    medium =  vuln.filter(project=project,vulnerabilityseverity='Medium',status='Vulnerable').count()
    low =  vuln.filter(project=project,vulnerabilityseverity='Low',status='Vulnerable').count()
    info = vuln.filter((Q(status='Vulnerable')) & (Q(vulnerabilityseverity='Informational') | Q(vulnerabilityseverity='None'))).count()

    custom_style = Style(
    colors=("#FF491C", "#F66E09", "#FBBC02", "#20B803", "#3399FF"),
    background='transparent',
    plot_background='transparent',
    legend_font_size=0,
    legend_box_size=0,
    value_font_size=40
    )
    pie_chart = pygal.Pie(style=custom_style)
    pie_chart.legend_box_size = 0

    pie_chart.add('Critical', ciritcal)
    pie_chart.add('High', high)
    pie_chart.add('Medium', medium)
    pie_chart.add('Low', low)
    pie_chart.add('Informational', info)


    ### Get Total Vulnerability Count
    totalvulnerability = vuln.filter(project=project).count()

    ### Get All Scope from the project
    projectscope = PrjectScope.objects.filter(project=project)

    ## Get Retest Details
    lastretest = ProjectRetest.objects.filter(project_id=pk).order_by('-id').first()
    totalretest = ProjectRetest.objects.filter(project_id=pk)
    data = {'projectscope':projectscope,'totalvulnerability':totalvulnerability,'standard':standard,'Report_type':Report_type,
            'totalretest':totalretest,'vuln':vuln,'project':project,"settings":settings,"url":url,'ciritcal':ciritcal,'high':high,
            'medium':medium,'low':low,'info':info,'instances':instances,'internalusers':internalusers,'customeruser':customeruser,'pie_chart':pie_chart.render(is_unicode=True)}

    try:
        # Render the template to a string
        rendered_content = render_to_string('Reportt/report.html', data, request=request)
        #print(rendered_content)

        # Create a WeasyTemplateResponse using the rendered content
        pdf = HTML(string=rendered_content,url_fetcher=my_fetcher,base_url='http://127.0.0.1:8000').write_pdf()

        # Return the PDF response
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="report.pdf"'
        return response
    except Exception as e:
        # Return a server error response if there's an issue
        return HttpResponseServerError(f"An error occurred: {e}")

    