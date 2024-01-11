from django.conf import settings
from .models import Project,Vulnerability,PrjectScope,Vulnerableinstance,ProjectRetest
from django.db.models import Q
from weasyprint import default_url_fetcher, HTML
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.http import HttpResponseServerError
from accounts.models import CustomUser
import pygal
from pygal.style import Style


def my_fetcher(url):
    if url.startswith('file://'):
        alloweddir = settings.BASE_DIR
        url = 'file:///' + url.replace('file:///', str(alloweddir))

    return default_url_fetcher(url)



def generate_pdf_report(Report_format,Report_type,pk,url,standard,request):

    # Get Project Details 
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

    try:
        # Render the template to a string
        rendered_content = render_to_string('report.html', data, request=request)
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

    