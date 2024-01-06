from .models import Project, Vulnerability, Vulnerableinstance,ProjectRetest,PrjectScope
from customers.models import Company
from django.conf import settings
from rest_framework.decorators import api_view,permission_classes,parser_classes
from rest_framework.response import Response
from .serializers import Projectserializers, Retestserializers,Vulnerabilityserializers,Instanceserializers,VulnerableinstanceSerializer, VulnerabilitySerializer2,ImageSerializer,PrjectScopeserializers
from rest_framework.permissions import IsAuthenticated
from rest_framework import views,status
from django.contrib.auth.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.db.models.signals import post_save
import logging
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser,FormParser
from django.core.files.storage import FileSystemStorage
from .nessus import is_valid_csv
from .report import generate_pdf_report, generate_pdf_report2
import os
from django.utils.decorators import method_decorator

from utils.permissions import custom_permission_required

logger = logging.getLogger(__name__)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Upload Nessus CSV'])
@parser_classes([MultiPartParser,FormParser])
def Nessus_CSV(request, pk):
    try:
        Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project Not Found, Project: %s is incorrect", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    file = request.FILES['file']
    output = is_valid_csv(file,pk)
    
    if output == False:
        return Response({'status': 'Failed',"message": "Invalid CSV, Unable to parse or missing required fields"})
      
    else:
        allvuln = Vulnerability.objects.filter(project=pk)
        serializer = VulnerabilitySerializer2(allvuln, many=True)
        return Response(serializer.data)
       


@api_view(['DELETE'])
@custom_permission_required(['Delete Images'])
def delete_images(request):
    media_path = settings.STATIC_ROOT

    image_paths = request.data

    for path in image_paths:
        path = path.lstrip('/')
        image_path =  os.path.join(settings.STATIC_ROOT, path)
        try:
            os.remove(image_path)
        except FileNotFoundError:
            pass 

    return Response({'message': 'Images deleted successfully'})



class ImageUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]
    
    @custom_permission_required(['Upload Images for Vulnerability'])
    def post(self, request):
        serializer = ImageSerializer(data=request.data)
        if serializer.is_valid():
            images = serializer.validated_data['images']        
            paths = []
            for image in images:
              
                fss = FileSystemStorage(location=settings.CKEDITOR_UPLOAD_LOCATION, base_url=settings.CKEDITOR_UPLOAD_URL)
                file = fss.save(image.name, image)
                file_url = fss.url(file)
                paths.append(file_url)
                
            return Response({'paths': paths})
        else:
            return Response(serializer.errors, status=400)






@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add Scope to Projects'])
def projectaddscope(request,pk):
    try:
        project = Project.objects.get(pk=pk)
        serializer = PrjectScopeserializers(data=request.data,many=True)
        if serializer.is_valid(raise_exception=True):
            serializer.save(project=project)
            return Response(serializer.data)
        else:
            logger.error("Serializer errors: %s", str(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    
   
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Scope from Projects'])
def deleteprojectscope(request):
    projects = PrjectScope.objects.filter(id__in=request.data)
    projects.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Scope from Projects'])
def projectscopedit(request,pk):
    try:
        projectscope = PrjectScope.objects.get(pk=pk)
        serializer = PrjectScopeserializers(instance=projectscope,data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            respdata={'Status':"Success"}
            respdata.update(serializer.data)

            return Response(respdata)
        else:
            logger.error("Sccope are incorrect")
            return Response(serializer.errors, status=400)
    except ObjectDoesNotExist:
        logger.error("Scope Not Found, : %s is incorrect", pk)
        return Response({"message": "Scope not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Scope from Projects'])
def getprojectscopes(request,pk):
    try:
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    projectscope = PrjectScope.objects.filter(project=project)
    serializer = PrjectScopeserializers(projectscope,many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add Vulnerability in Projects'])
def create_vulnerability(request):
    projectid = request.data.get('project')

    try:
        Projectobject = Project.objects.get(pk=projectid)
    except ObjectDoesNotExist:
        logger.error("Project Not Found, Project: %s is incorrect", projectid)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    vulnserializer = VulnerabilitySerializer2(data=request.data)
    if vulnserializer.is_valid(raise_exception=True):
        instacesserilization = VulnerableinstanceSerializer(data=request.data.get('instance'), many=True)
        if instacesserilization.is_valid():
            vulnerability = vulnserializer.save()
            instances = instacesserilization.save(vulnerabilityid=vulnerability, project=Projectobject)
            respdata = vulnserializer.data
            respdata.update({'instance': instacesserilization.data})
            return Response(respdata, status=201)
        else:
            logger.error("instances are incorrect")
            return Response(vulnserializer.errors, status=400)
    else:
        logger.error(vulnserializer.errors)
        return Response(vulnserializer.errors, status=400)





@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Create new Projects'])
def newproject(request):
    serializer = Projectserializers(data=request.data, context={'request': request})

    if serializer.is_valid(raise_exception=True):
        serializer.save()
        logger.info("Project Creted by %s", request.user)
        return Response(serializer.data)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

  


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Projects'])
def project_edit(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found with pk=%s", pk)
        
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = Projectserializers(instance=project, data=request.data, context={'request': request})
    if serializer.is_valid(raise_exception=True):
        
        serializer.save()
        respdata = {'Status': "Success"}
        respdata.update(serializer.data)
        logger.info("Project updated by %s for Project id=%s", request.user, pk)
        return Response(respdata)
    else:
        logger.error("Serializer errors: %s", str(serializer.errors))
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Specific Project'])
def getproject(request,pk):
    try:
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = Projectserializers(project,many=False)
    return Response(serializer.data)


@api_view(['GET']) 
@permission_classes([IsAuthenticated])
@custom_permission_required(['Change Project Status to Complete'])
def complete_project_status(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Project not found for id=%s", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
    
    # Set the project status to 'Completed'
    project.status = 'Completed'
    project.save()
    
    return Response({'message': f'Status of project {pk} updated to Completed'})



class GetAllProjects(views.APIView):
    permission_classes = [IsAuthenticated]
    @custom_permission_required(['View All Projects'])
    def get(self, request):
        projects = Project.objects.all()    
        serializer = Projectserializers(projects, many=True)
        return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Projects'])
def deleteproject(request):
    projects = Project.objects.filter(id__in=request.data)
    projects.delete()
    respdata={'Status':"Success"}
    return Response(respdata)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View all Vulnerability for Project'])
def projectfindingview(request, pk):
    try:
        vulnerability = Vulnerability.objects.filter(project=pk)
        serializer = Vulnerabilityserializers(vulnerability, many=True)
        return Response(serializer.data)
    except ObjectDoesNotExist:
        logger.error("Project Vulnerrability not found for id=%s", pk)
        return Response({"message": "Vulnerrability not found"}, status=status.HTTP_404_NOT_FOUND)
       



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Vulnerability'])
def projectvulnedit(request,pk):
    vulnerability = Vulnerability.objects.get(pk=pk)
    serializer = Vulnerabilityserializers(instance=vulnerability,data=request.data)
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        respdata={'Status':"Success"}
        respdata.update(serializer.data)

        return Response(respdata)





@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Vulnerability'])
def projectvulndelete(request):
    vuln = Vulnerability.objects.filter(id__in=request.data)
    vuln.delete()
    respdata={'Status':"Success"}
    return Response(respdata)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Specific Vulnerability'])
def projectvulnview(request,pk):
    try:
        vulnerability = Vulnerability.objects.get(pk=pk)
        serializer = Vulnerabilityserializers(vulnerability,many=False)
        return Response(serializer.data)
    except ObjectDoesNotExist:
        logger.error("Vulnerrability not found for id=%s", pk)
        return Response({"message": "Vulnerrability not found"}, status=status.HTTP_404_NOT_FOUND)

    



@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View All Instances For Vulnerability'])
def projectvulninstances(request,pk):
    instances = Vulnerableinstance.objects.filter(vulnerabilityid=pk)
    if not instances:
        logger.error("Vulnerrability Instance not found for id=%s", pk)
        return Response({"message": "Instancce not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        serializer = Instanceserializers(instances,many=True)
        return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add Instances'])
def projectaddinstances(request,pk):
    try:
        vulnerability = Vulnerability.objects.get(pk=pk)
        project = vulnerability.project
        #request.data['vulnerabilityid'] = pk
        serializer = Instanceserializers(data=request.data,many=True)
        if serializer.is_valid(raise_exception=True):
            serializer.save(vulnerabilityid=vulnerability,project=project)
            return Response(serializer.data)
        else:
            logger.error("Serializer errors: %s", str(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except ObjectDoesNotExist:
        logger.error("Vulnerrability not found for id=%s", pk)
        return Response({"message": "Vulnerrability not found"}, status=status.HTTP_404_NOT_FOUND)
    
   


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Edit Instances'])
def projecteditinstances(request,pk):
    try:
        instance = Vulnerableinstance.objects.get(pk=pk)

        serializer = Instanceserializers(instance=instance,data=request.data,partial=True)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        else:
            logger.error("Serializer errors: %s", str(serializer.errors))
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except ObjectDoesNotExist:
        logger.error("Instance not found for id=%s", pk)
        return Response({"message": "Instance not found"}, status=status.HTTP_404_NOT_FOUND)





@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Instances'])
def projectdeleteinstances(request):
    vluninstace = Vulnerableinstance.objects.filter(id__in=request.data)
    if not vluninstace:
        logger.error("Instance not found")
        return Response({"message": "Instance not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        vluninstace.delete()
        respdata={'Status':"Success"}
        return Response(respdata)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Change Instances Status'])
def projectinstancesstatus(request):
    vluninstace = Vulnerableinstance.objects.filter(id__in=request.data)
    if not vluninstace:
        logger.error("Instance not found")
        return Response({"message": "Instance not found"}, status=status.HTTP_404_NOT_FOUND)
    else:
        instancestatus = request.query_params.get('status')
        if instancestatus is None:
            logger.error("Status not defined")
            return Response({"message": "Missing 'status' parameter"}, status=status.HTTP_400_BAD_REQUEST)
        
        choices = dict(Vulnerableinstance.status.field.choices)
        if instancestatus not in choices:
            logger.error("Instance Status is not valid from %s", choices)
            return Response({"message": f"Invalid status choice: {instancestatus}"}, status=status.HTTP_400_BAD_REQUEST)
        rows_updated = vluninstace.update(status=instancestatus)
        respdata = {'status': 'Success'}
        vulnerability_ids = vluninstace.values_list('vulnerabilityid', flat=True).distinct()
        for vulnerability_id in vulnerability_ids:
            vulnobject = Vulnerability.objects.get(id=vulnerability_id)
            post_save.send(sender=Vulnerability, instance=vulnobject, created=False)


      
        return Response(respdata)
    


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Vulnerability Status'])
def projectvulnerabilitystatus(request,pk):
    try:
        vuln = Vulnerability.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Vulnerability not found for id=%s", pk)
        return Response({"Vulnerability": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)
    
    instancestatus = request.query_params.get('status')
    if instancestatus is None:
        logger.error("Status not defined")
        return Response({"message": "Missing 'status' parameter"}, status=status.HTTP_400_BAD_REQUEST)
        
    choices = dict(Vulnerability.status.field.choices)
    if instancestatus not in choices:
        logger.error("Instance Status is not valid from %s", choices)
        return Response({"message": f"Invalid status choice: {instancestatus}"}, status=status.HTTP_400_BAD_REQUEST)
    
    vluninstace = Vulnerableinstance.objects.filter(vulnerabilityid=pk)
    rows_updated = vluninstace.update(status=instancestatus)
    vuln.status = instancestatus
    vuln.save()
    respdata = {'status': 'Success'}
    return Response(respdata)
    




       
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Delete Retest Task'])
def Retestdelete(request,pk):
    try:
        retest = ProjectRetest.objects.get(pk=pk)
    except ObjectDoesNotExist:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)
    retest.delete()
    respdata={'Status':"Success"}
    return Response(respdata)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['View Retest for Projects'])
def RetestList(request,pk):
    retest = ProjectRetest.objects.filter(project=pk)

    if not retest:
        logger.error("Retest not found for id=%s", pk)
        return Response({"message": "Retest not found"}, status=status.HTTP_404_NOT_FOUND)

    else:
        serializer = Retestserializers(retest,many=True)
        return Response(serializer.data)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Add Retest for Projects'])
def Retestadd(request):
    serializer_context = {'request': request}
    serializer = Retestserializers(data=request.data,many=False,context=serializer_context)
    #userid = request.user.id
    
    
    if serializer.is_valid(raise_exception=True):
        serializer.save()
        logger.info("Project retest added by %s for Project id=%s", request.user, request.data.get('project'))
        return Response(serializer.data)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
@custom_permission_required(['Report Access'])
def project_report(request, pk):
    try:
        project = Project.objects.get(pk=pk)
        #print(project.companyname.name)

        #Checking if project has any vulnerabilities added
        has_vulnerabilities = Vulnerability.objects.filter(project=project).exists()
        if not has_vulnerabilities:
            logger.error("Project has no vulnerabilities, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no vulnerabilities, Kindly add vulnerabilities to generate project"})
        
        has_scope = PrjectScope.objects.filter(project=project).exists()
        if not has_scope:
            logger.error("Project has no Sccope added, Project: %s is Empty", pk)
            return Response({"Status": "Failed", "Message": "Project has no Sccope added, Kindly add Scope to generate project"})
        
        for vulnerability in project.vulnerability_set.all():
            if vulnerability.instances.count() == 0:
                logger.error("Vulnerability %s has no Instance added", vulnerability.vulnerabilityname)
                response_data = {"Status": "Failed", "Message": "Vulnerability %s has no Instance added, Kindly add Instance to generate project" % vulnerability.vulnerabilityname}
                return Response(response_data)
            
        if (request.data.get('Format')) == 'pdf':
            Report_format = request.data.get('Format')
        else:
            logger.error("Report Format is incorrect Only pdf is supported")
            return Response({"Status": "Failed", "Message": "Report Format is incorrect Only pdf is supported"})
        


        if request.data.get('Type') == 'Audit':
            Report_type = request.data.get('Type')
        elif request.data.get('Type') == 'Re-Audit':
            if ProjectRetest.objects.filter(project=project).exists():
                Report_type = request.data.get('Type')
            else:
                logger.error("Project Has no Retest generate ReAudit Report")
                return Response({"Status": "Failed", "Message": "Project Has no Retest generate ReAudit Report"})
        else:
            logger.error("Report Type is incorrect Only Audit or Re-Audit are supported")
            return Response({"Status": "Failed", "Message": "Report Type is incorrect Only Audit or Re-Audit are supported"})

        url = request.build_absolute_uri()
        standard = request.data.get('Standard')
        output = generate_pdf_report2(Report_format,Report_type,pk,url,standard,request)
        #response = HttpResponse(content_type='application/pdf')
        #response['Content-Disposition'] = "attachment; filename='mypdf.pdf'"
        #response = HttpResponse(output)
        return output

        #return Response({"Status": "OK"})
    except ObjectDoesNotExist:
        logger.error("Project Not Found, Project: %s is incorrect", pk)
        return Response({"message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
