import io
import logging
import urllib
import os
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
import bleach
import pygal
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from rest_framework.response import Response
from django.template.loader import render_to_string
from django.template import TemplateDoesNotExist
from pygal.style import Style
from weasyprint import HTML
from xlsxwriter.workbook import Workbook
from docxtpl import DocxTemplate,RichText
from django.shortcuts import get_object_or_404
from datetime import datetime
from jinja2.sandbox import SandboxedEnvironment
import html
import traceback


from accounts.models import CustomUser, CustomGroup
from customers.models import Company
from .models import (PrjectScope, Project, ProjectRetest, Vulnerability,
                     Vulnerableinstance)
from utils.doc_style import get_subdoc ,main_doc_style
logger = logging.getLogger(__name__)
logger = logging.getLogger('weasyprint')

# Global variable to store base_url and token
base_url = ""
token = None


def CheckReport(Report_format,Report_type,pk,url,standard,request,access_token):
    global base_url
    base_url = url
    if Report_format == "excel":
        response =  CreateExcel(pk)

    global token
    token = access_token
    if Report_format == "docx":
        response = generate_vulnerability_document(pk,Report_type,standard)
    if Report_format == "pdf":
        response = GetHTML(Report_type,pk,standard,request)

    return response



def generate_vulnerability_document(pk,Report_type,standard):
    try:
        project_id = pk
        project = get_object_or_404(Project, id=project_id)
        owners = project.owner.all()
        vuln = Vulnerability.objects.filter(project=project).order_by('-cvssscore')
        totalvulnerability = vuln.filter(project=project).count()
        totalretests_queryset = ProjectRetest.objects.filter(project_id=pk)

        projectscope = PrjectScope.objects.filter(project=project)
        template_path = os.path.join(settings.BASE_DIR, 'templates', 'report.docx')
        doc = DocxTemplate(template_path)
        project_manager_group = CustomGroup.objects.get(name='Project Manager')
        projectmanagers = CustomUser.objects.filter(groups=project_manager_group)
        customeruser =  CustomUser.objects.filter(company=project.companyname, is_active=True)
        mycomany = Company.objects.filter(internal=True).values_list('name', flat=True).first()
        project_description = get_subdoc(doc, project.description,token, base_url)
        project_exception = get_subdoc(doc, project.projectexception,token, base_url)

        for vulnerability in vuln:
            # Convert CKEditor fields from HTML to DOCX format
            vulnerability.vulnerabilitydescription = get_subdoc(doc, vulnerability.vulnerabilitydescription,token, base_url)
            vulnerability.POC = get_subdoc(doc, vulnerability.POC, token,base_url)
            vulnerability.vulnerabilitysolution = get_subdoc(doc, vulnerability.vulnerabilitysolution, token,base_url)
            vulnerability.vulnerabilityreferlnk = get_subdoc(doc, vulnerability.vulnerabilityreferlnk,token, base_url)

            vulnerability.instances_data = [
                {
                    'URL': instance.URL,
                    'Parameter': instance.Parameter if instance.Parameter is not None else '',  # Set empty string for None
                    'Status': instance.status
                }
                for instance in Vulnerableinstance.objects.filter(vulnerabilityid=vulnerability, project=project)
                if instance.URL  # Exclude instances with empty URL
            ]

        totalretest = [
        {
            "startdate": retest.startdate,
            "enddate": retest.enddate,
            "owners": [owner.full_name for owner in retest.owner.all()]
        }
        for retest in totalretests_queryset
        ]
        currentdate=datetime.now()
        context = {'project': project, 'vulnerabilities': vuln,'Report_type':Report_type,'mycomany':mycomany,'projectmanagers':projectmanagers,'customeruser':customeruser,'owners': owners,
                'project_exception':project_exception,'project_description':project_description,"settings":settings,"currentdate":currentdate,
                'standard':standard,'totalvulnerability':totalvulnerability,'totalretest':totalretest,'projectscope':projectscope,
                'page_break': RichText('\f'),'new_line': RichText('\n')
                }
        jinja_env = SandboxedEnvironment(autoescape=True)
        jinja_env.trim_blocks = True
        jinja_env.lstrip_blocks = True
        doc.render(context,jinja_env)
        doc = main_doc_style(doc)
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response['Content-Disposition'] = f'attachment; filename={project.name}vulnerability_report.docx'
        doc.save(response)
        return response
    
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        logger.error("Traceback: " + traceback.format_exc())
        return Response({"Status": "Failed", "Message": "Something Went Wrong"})


def CreateExcel(pk):
    try:
        project_name = Project.objects.values_list('name', flat=True).get(id=pk)
        instances = Vulnerableinstance.objects.filter(project_id=pk).select_related('vulnerabilityid').order_by('-vulnerabilityid__cvssscore')
        output = io.BytesIO()
        book = Workbook(output)
        sheet = book.add_worksheet('Vulnerabilities')
        wrap_format = book.add_format({'text_wrap': True, 'align': 'center', 'valign': 'vcenter'})
        sheet.set_column('A:A', 20)
        sheet.set_column('C:C', 15)
        sheet.set_column('D:D', 15)
        sheet.set_column('E:E', 15)
        sheet.set_column('G:G', 70)
        sheet.set_column('H:H', 70)

        # Write header
        header = ['Title', 'Severity', 'Status', 'URL/IP', 'Parameter/Port', 'CVSS Score', 'Description','Recommendation']
        for col_num, col_value in enumerate(header):
            sheet.write(0, col_num, col_value,wrap_format)

        # Write data rows
        for row_num, instance in enumerate(instances, start=1):
            row_data = [
                instance.vulnerabilityid.vulnerabilityname,
                instance.vulnerabilityid.vulnerabilityseverity,
                instance.status,
                instance.URL,
                instance.Parameter,
                instance.vulnerabilityid.cvssscore,
                html.unescape(bleach.clean(instance.vulnerabilityid.vulnerabilitydescription, tags=[], strip=True)),
                html.unescape(bleach.clean(instance.vulnerabilityid.vulnerabilitysolution, tags=[], strip=True))
            ]
            for col_num, col_value in enumerate(row_data):
                sheet.write(row_num, col_num, col_value, wrap_format)


        book.close()
        response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename={project_name}vulnerability_report.xlsx'

        return response
    
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return Response({"Status": "Failed", "Message": "Something Went Wrong"})




def GetHTML(Report_type,pk,standard,request):
    try:

        project = Project.objects.get(pk=pk)

        ## Get All Projects Vulnerability filter higher to lower CVSS Score
        vuln = Vulnerability.objects.filter(project=project).order_by('-cvssscore')

        #### Get ALL Instances for the Projects  (Not using Vulnerability colum)  ### Need to optimize to speed up the HTML generation
        instances = Vulnerableinstance.objects.filter(project=project)
        project_manager_group = CustomGroup.objects.get(name='Project Manager')

        projectmanagers = CustomUser.objects.filter(groups=project_manager_group)
        customeruser =  CustomUser.objects.filter(company=project.companyname, is_active=True)


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
        mycomany = Company.objects.filter(internal=True).values_list('name', flat=True).first()


        ### Get All Scope from the project
        projectscope = PrjectScope.objects.filter(project=project)

        ## Get Retest Details
        totalretest = ProjectRetest.objects.filter(project_id=pk)
        data = {'projectscope':projectscope,'totalvulnerability':totalvulnerability,'standard':standard,'Report_type':Report_type,'mycomany':mycomany,
                'totalretest':totalretest,'vuln':vuln,'project':project,'ciritcal':ciritcal,'high':high,
                'medium':medium,'low':low,'info':info,'instances':instances,'projectmanagers':projectmanagers,'customeruser':customeruser,'pie_chart':pie_chart.render(is_unicode=True)}
        try:
            # Render the template to a string
            rendered_content = render_to_string('report.html', data, request=request)
            response = generate_pdf_report(rendered_content,base_url)
            response['Content-Disposition'] = f'attachment; filename={project.name}vulnerability_report.pdf'
            return response
        except (TemplateDoesNotExist, IOError) as e:
            # Handle template not found error
            logger.error("Something Went Wrong: %s", e)
            return Response({"Status": "Failed", "Message": "Something Went Wrong"})
        
    except Exception as e:
        logger.error(f"An error occurred: {e}")
        return Response({"Status": "Failed", "Message": "Something Went Wrong"})


def generate_pdf_report(rendered_content,base_url):
    try:
        pdf = HTML(string=rendered_content,url_fetcher=my_fetcher,base_url=base_url).write_pdf()
        # Return the PDF response
        response = HttpResponse(pdf, content_type='application/pdf')
        return response
    except Exception as e:
        # Return a server error response if there's an issue
        logger.error("Something Went Wrong: %s", e)
        return Response({"Status": "Failed", "Message": "Something Went Wrong"})


def is_whitelisted(url):
    """Checks if the given URL is whitelisted to protect against SSRF to access internal or external network."""
    parsed_url = urllib.parse.urlparse(url)
    netloc = parsed_url.netloc.lower()  # Normalize for case-insensitive comparison
    port = parsed_url.port if parsed_url.port else 80  # Default to port 80 if not specified


    # Construct a normalized representation of the whitelisted entry
    for whitelisted_entry in settings.WHITELIST_IP:
        whitelisted_parsed = urllib.parse.urlparse(whitelisted_entry)
        whitelisted_netloc = whitelisted_parsed.netloc.lower()
        whitelisted_port = whitelisted_parsed.port if whitelisted_parsed.port else 80

        if netloc == whitelisted_netloc and port == whitelisted_port:
            return True

    logger.error("URL is not Whitelisted Check the %s", url)
    return False



def my_fetcher(url):

    # Check if the URL is whitelisted
    if is_whitelisted(url):
        requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
        if "/api/project/getimage/" in url:
            headers = {
                "Authorization": f"Bearer {token}"
            }
            response = requests.get(url, headers=headers, verify=False)
            response.raise_for_status()

            return {
                "string": response.content,
                "mime_type": response.headers.get("Content-Type", "image/jpeg"),
                "encoding": response.encoding,
                "redirected_url": response.url
            }

        else:
            response = requests.get(url, verify=False)
            response.raise_for_status()
            mime_type = response.headers.get("Content-Type", "application/octet-stream")
            return {
                "string": response.content,
                "mime_type": mime_type,
                "encoding": response.encoding,
                "redirected_url": response.url
            }
    else:
        raise ValueError(f'URL is Not WhiteListed for: {url!r}')