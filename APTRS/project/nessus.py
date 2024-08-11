import csv
import logging
import json
import io
from django.conf import settings
from .models import Vulnerability, Project
from .serializers import VulnerableinstanceSerializerNessus

logger = logging.getLogger(__name__)


def is_valid_csv(file,pk):
    required_columns = ['Host', 'Port', 'Name', 'Description', 'Solution', 'Risk']

    try:
        file_data = io.StringIO(file.read().decode('utf-8'))
        reader = csv.DictReader(file_data)
        headers = reader.fieldnames


        if all(column in headers for column in required_columns):
            jsonobject = parse_nessus_csv(reader)
            file_data.seek(0)
            save_vulnerability(jsonobject,pk)
            save_vulnerableinstance(file_data,jsonobject,pk)
            return jsonobject
        else:
            logger.error("Required columns are not present in the CSV file")
            return False
    except (UnicodeDecodeError, csv.Error, IOError) as e:
        logger.error("Error while validating CSV file: %s", e)
        return False


def save_vulnerability(data, pk):
    projectdata = Project.objects.get(pk=pk)

    for vulnerability_data in data['vulnerability']:
        vulnerability_name = vulnerability_data['vulnerabilityname']

        # Check if vulnerability with the same name already exists for the project
        if Vulnerability.objects.filter(project=projectdata, vulnerabilityname=vulnerability_name).exists():
            logger.info("Vulnerability with name %s already exists for project %s, Skip", vulnerability_name, pk)
            continue  # Skip this vulnerability and move to the next one

        vulnerability = Vulnerability(
            project=projectdata,
            vulnerabilityname=vulnerability_name,
            vulnerabilityseverity=vulnerability_data['vulnerabilityseverity'],
            cvssscore=vulnerability_data['cvssscore'],
            cvssvector=vulnerability_data['cvssvector'],
            status='Vulnerable',  # Set the default status
            vulnerabilitydescription=vulnerability_data['vulnerabilitydescription'],
            vulnerabilitysolution=vulnerability_data['vulnerabilitysolution']
        )

        vulnerability.save()


def save_vulnerableinstance(file_data,jsonobject, pk):
    csv.DictReader(file_data)
    vulnerability_dict =jsonobject
    projectdata = Project.objects.get(pk=pk)
    mycsvtojson = json.dumps(vulnerability_dict)
    vulnerability_dict = json.loads(mycsvtojson)
    affected_hosts = []

    for vulnerability in vulnerability_dict["vulnerability"]:

        vulnerability_name = vulnerability["vulnerabilityname"]

        vuln = Vulnerability.objects.get(project=projectdata.id, vulnerabilityname=vulnerability_name)

        file_data.seek(0)
        reader = csv.DictReader(file_data)
        for row in reader:
            if row['Name'] == vulnerability_name:
                affected_hosts.append({'URL': row['Host'],'Parameter': row['Port'],'vulnerabilityid':vuln.id,'project':projectdata.id})


    vulnerability_dict = {'Instances': affected_hosts}


    instacesserilization = VulnerableinstanceSerializerNessus(data=vulnerability_dict['Instances'], many=True)
    if instacesserilization.is_valid():
        instacesserilization.save()

    else:
        logger.error("Serializer errors: %s", str(instacesserilization.errors))


def parse_nessus_csv(reader):


    unique_vulnerabilities = {}

    for row in reader:

        if row['Name'] not in unique_vulnerabilities:
            # If not, add the vulnerability name and description to the dictionary
            if row['Risk'] in ["None", "Info"]:
                Base = settings.CVSS_BASE_INFO
                score = settings.CVSS_BASE_SCORE_INFO
            elif row['Risk'] == "Low":
                Base = settings.CVSS_BASE_LOW
                score = settings.CVSS_BASE_SCORE_LOW
            elif row['Risk'] == "Medium":
                Base = settings.CVSS_BASE_MEDIUM
                score = settings.CVSS_BASE_SCORE_MEDIUM
            elif row['Risk'] == "High":
                Base = settings.CVSS_BASE_HIGH
                score = settings.CVSS_BASE_SCORE_HIGH
            elif row['Risk'] == "Critical":
                Base = settings.CVSS_BASE_CRITICAL
                score = settings.CVSS_BASE_SCORE_CRITICAL
            else:
                Base = settings.CVSS_BASE_INFO
                score = settings.CVSS_BASE_SCORE_INFO

            unique_vulnerabilities[row['Name']] = {'vulnerabilityname': row['Name'], 'vulnerabilitydescription': row['Description'], 'vulnerabilitysolution': row['Solution'], 'vulnerabilityseverity': row['Risk'], 'cvssscore': score, 'cvssvector': Base}
    vulnerability_dict = {'vulnerability': list(unique_vulnerabilities.values())}

    return vulnerability_dict
