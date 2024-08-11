import io
import logging
import urllib
import os
import bleach
import pygal
from django.conf import settings
from django.db.models import Q
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.template import TemplateDoesNotExist
from pygal.style import Style
from weasyprint import HTML, default_url_fetcher
from xlsxwriter.workbook import Workbook
from docx import Document
from docxtpl import DocxTemplate,RichText
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from htmldocx import HtmlToDocx
from datetime import datetime
from docx.shared import Inches, Pt


from accounts.models import CustomUser
from .models import (PrjectScope, Project, ProjectRetest, Vulnerability,
                     Vulnerableinstance)

logger = logging.getLogger(__name__)

def apply_font_style(element, font_name, font_size):
    if hasattr(element, 'font'):
        element.font.name = font_name
        element.font.size = Pt(font_size)

def apply_font_to_elements(elements, font_name, font_size):
    for element in elements:
        apply_font_style(element, font_name, font_size)
        if hasattr(element, 'runs'):
            for run in element.runs:
                apply_font_style(run, font_name, font_size)

def resize_inline_images(temp_doc, fixed_width):
    for i, image in enumerate(temp_doc.inline_shapes):
        original_width, original_height = image.width, image.height

        # Calculate new height to maintain the aspect ratio
        new_height = int(original_height * fixed_width / original_width)

        # Set the fixed width and calculated height
        image.width = fixed_width
        image.height = new_height

def get_subdoc(doc, raw_html):

    temp_doc = Document()
    temp_parser = HtmlToDocx()

    if raw_html is not None:

        # Convert image src paths - doctpl does not support loading img over url, adding image full path
        raw_html = raw_html.replace('src="/media', f'src="{settings.BASE_DIR}/static/media/')
        # Wrap the HTML in a div with styling for margins
        styled_html = f'<div style="margin-left: 20pt; margin-right: 20pt;">{raw_html}</div>'

        # Convert HTML to temporary DOCX

    
        temp_parser.add_html_to_document(styled_html, temp_doc)

        # Resize images in the temporary DOCX
        ## https://stackoverflow.com/questions/76571366/resizing-all-images-in-a-word-document-using-python
        text_width = temp_doc.sections[0].page_width - temp_doc.sections[0].left_margin - temp_doc.sections[0].right_margin

        resize_inline_images(temp_doc, fixed_width=text_width)
        apply_font_to_elements(temp_doc.element.body, 'Calibri', 16)

        for paragraph in temp_doc.paragraphs:
            paragraph.paragraph_format.space_before = Pt(5)
            paragraph.paragraph_format.space_after = Pt(5)
            paragraph.paragraph_format.left_indent = Inches(1)
            paragraph.paragraph_format.right_indent = Inches(1)
            paragraph.paragraph_format.top_indent = Inches(1)



        obj_styles = temp_doc.styles
        for current_style in obj_styles:
            element = current_style
            if hasattr(element, 'font'):
                font = element.font
                font.name = 'Calibri'
                font.size = Pt(16)
        

        font = temp_doc.styles['Normal'].font
        font.name = 'Calibri'
        font.size = Pt(16)
        font = temp_doc.styles['List Bullet'].font
        font.name = 'Calibri'
        font.size = Pt(16)

    # Save temporary DOCX in memory
    subdoc_tmp = io.BytesIO()
    temp_doc.save(subdoc_tmp)
    

    # Create docxtpl subdoc object
    subdoc = doc.new_subdoc(subdoc_tmp)
    return subdoc


def generate_vulnerability_document(pk,Report_type,standard):
    project_id = pk
    project = get_object_or_404(Project, id=project_id)
    vuln = Vulnerability.objects.filter(project=project).order_by('-cvssscore')
    totalvulnerability = vuln.filter(project=project).count()
    totalretest = ProjectRetest.objects.filter(project_id=pk)
    projectscope = PrjectScope.objects.filter(project=project)
    internalusers = CustomUser.objects.filter(is_staff=True,is_active=True)
    customeruser = CustomUser.objects.filter(is_active=True,company=project.companyname)
    template_path = os.path.join(settings.BASE_DIR, 'templates', 'report.docx')
    doc = DocxTemplate(template_path)

    for vulnerability in vuln:
        # Convert CKEditor fields from HTML to DOCX format
        vulnerability.vulnerabilitydescription = get_subdoc(doc, vulnerability.vulnerabilitydescription)
        vulnerability.POC = get_subdoc(doc, vulnerability.POC)
        vulnerability.vulnerabilitysolution = get_subdoc(doc, vulnerability.vulnerabilitysolution)
        vulnerability.vulnerabilityreferlnk = get_subdoc(doc, vulnerability.vulnerabilityreferlnk)
        #print(vulnerability.POC)

        vulnerability.instances_data = [
            {
                'URL': instance.URL,
                'Parameter': instance.Parameter if instance.Parameter is not None else '',  # Set empty string for None
                'Status': instance.status
            }
            for instance in Vulnerableinstance.objects.filter(vulnerabilityid=vulnerability, project=project)
            if instance.URL  # Exclude instances with empty URL
        ]
        currentdate=datetime.now()
        #print(vulnerability.instances_data)
    context = {'project': project, 'vulnerabilities': vuln,'Report_type':Report_type,
               "settings":settings,"currentdate":currentdate,'value2':'10',
               'standard':standard,'totalvulnerability':totalvulnerability,'totalretest':totalretest,'projectscope':projectscope,
               'internalusers':internalusers,'page_break': RichText('\f')
               }
    doc.render(context)
    font = doc.styles['List Bullet'].font
    font.name = 'Calibri'
    font.size = Pt(16)
    
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    response['Content-Disposition'] = f'attachment; filename=vulnerability_report_{project_id}.docx'
    
    doc.save(response)

    return response
    


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
    if is_whitelisted(url):
        return default_url_fetcher(url)
    else:
        raise ValueError(f'URL is Not WhiteListed for: {url!r}')



def CheckReport(Report_format,Report_type,pk,url,standard,request):
    if Report_format == "excel":
        response =  CreateExcel(pk)
    elif Report_format == "docx":
        response = generate_vulnerability_document(pk,Report_type,standard)
    else:
        response = GetHTML(Report_format,Report_type,pk,url,standard,request)
    return response


def CreateExcel(pk):
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
            bleach.clean(instance.vulnerabilityid.vulnerabilitydescription, tags=[], strip=True),
            bleach.clean(instance.vulnerabilityid.vulnerabilitysolution, tags=[], strip=True)
        ]
        for col_num, col_value in enumerate(row_data):
            sheet.write(row_num, col_num, col_value, wrap_format)


    book.close()
    response = HttpResponse(output.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename=instances.xlsx'

    return response




def GetHTML(Report_format,Report_type,pk,url,standard,request):
    project = Project.objects.get(pk=pk)

    ## Get All Projects Vulnerability filter higher to lower CVSS Score
    vuln = Vulnerability.objects.filter(project=project).order_by('-cvssscore')

    #### Get ALL Instances for the Projects  (Not using Vulnerability colum)  ### Need to optimize to speed up the HTML generation
    instances = Vulnerableinstance.objects.filter(project=project)

    internalusers = CustomUser.objects.filter(is_staff=True,is_active=True)
    customeruser = CustomUser.objects.filter(is_active=True,company=project.companyname)


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
    totalretest = ProjectRetest.objects.filter(project_id=pk)
    data = {'projectscope':projectscope,'totalvulnerability':totalvulnerability,'standard':standard,'Report_type':Report_type,
            'totalretest':totalretest,'vuln':vuln,'project':project,"settings":settings,"url":url,'ciritcal':ciritcal,'high':high,
            'medium':medium,'low':low,'info':info,'instances':instances,'internalusers':internalusers,'customeruser':customeruser,'pie_chart':pie_chart.render(is_unicode=True)}
    base_url = f"{request.scheme}://{request.get_host()}"
    try:
        # Render the template to a string
        rendered_content = render_to_string('report.html', data, request=request)
        if Report_format == "pdf":
            response = generate_pdf_report(rendered_content,base_url)
        if Report_format == "html":

            response = HttpResponse(rendered_content,content_type='text/html')
        return response
    except (TemplateDoesNotExist, IOError) as e:
        # Handle template not found error
        logger.error("Something Went Wrong: %s", e)
        return HttpResponse("Something Went Wrong", status=500)


def generate_pdf_report(rendered_content,base_url):
    try:
        pdf = HTML(string=rendered_content,url_fetcher=my_fetcher,base_url=base_url).write_pdf()
        # Return the PDF response
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="report.pdf"'
        return response
    except Exception as e:
        # Return a server error response if there's an issue
        logger.error("Something Went Wrong: %s", e)
        return HttpResponse("Something went wrong", status=500)
