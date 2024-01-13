from django.conf import settings
from .models import Project,Vulnerability,PrjectScope,Vulnerableinstance,ProjectRetest
from django.db.models import Q
from weasyprint import default_url_fetcher, HTML
from django.http import HttpResponse
from django.template.loader import render_to_string
from accounts.models import CustomUser
import pygal
from pygal.style import Style
import bleach
from xlsxwriter.workbook import Workbook
import io
import logging
import urllib

logger = logging.getLogger(__name__)




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
        raise ValueError('URL is Not WhiteListe for: %r' % url)



def CheckReport(Report_format,Report_type,pk,url,standard,request):
    if Report_format == "excel":
        response =  CreateExcel(pk)
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
            instance.Paramter,
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
    except Exception:
        # Return a server error response if there's an issue
        return HttpResponse("Something went wrong")


def generate_pdf_report(rendered_content,base_url):
    try:  
        pdf = HTML(string=rendered_content,url_fetcher=my_fetcher,base_url=base_url).write_pdf()
        # Return the PDF response
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="report.pdf"'
        return response
    except Exception:
        # Return a server error response if there's an issue
        return HttpResponse("Something went wrong")

    