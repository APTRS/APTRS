# Module for validating project completeness and structure
import logging
from django.db.models import Count
from django.core.exceptions import ObjectDoesNotExist

from ..models import Project, PrjectScope, Vulnerability

logger = logging.getLogger(__name__)

def validate_project_completeness(project_id):
    """
    Validates if a project meets all requirements for completeness:
    1. Project has standards defined
    2. Project has at least one scope
    3. Project has at least one vulnerability
    4. All vulnerabilities have at least one instance
    
    Args:
        project_id (int): ID of the project to validate
        
    Returns:
        dict: A dictionary with validation status and details
            {
                'valid': bool,
                'errors': list of validation error messages,
                'details': dict with counts of components
            }
    """
    result = {
        'valid': True,
        'errors': [],
        'details': {
            'standards_count': 0,
            'scopes_count': 0,
            'vulnerabilities_count': 0,
            'vulnerabilities_without_instances': []
        }
    }

    try:
        # Check if project exists
        project = Project.objects.get(pk=project_id)

        # 1. Check if project has standards
        standards = project.standard
        if not standards or len(standards) == 0:
            result['valid'] = False
            result['errors'].append("Project has no standards defined")
        else:
            result['details']['standards_count'] = len(standards)

        # 2. Check if project has at least one scope
        scopes_count = PrjectScope.objects.filter(project=project).count()
        result['details']['scopes_count'] = scopes_count

        if scopes_count == 0:
            result['valid'] = False
            result['errors'].append("Project has no scopes defined")

        # 3. Check if project has at least one vulnerability
        vulnerabilities = Vulnerability.objects.filter(project=project)
        vulnerabilities_count = vulnerabilities.count()
        result['details']['vulnerabilities_count'] = vulnerabilities_count

        if vulnerabilities_count == 0:
            result['valid'] = False
            result['errors'].append("Project has no vulnerabilities defined")
        else:
            # 4. Check if all vulnerabilities have at least one instance
            # Get vulnerabilities with instance counts in a single query
            vulnerabilities_with_counts = vulnerabilities.annotate(
                instance_count=Count('instances')
            )

            # Find vulnerabilities without instances
            vulnerabilities_without_instances = list(
                vulnerabilities_with_counts.filter(instance_count=0).values(
                    'id', 'vulnerabilityname')
            )

            if vulnerabilities_without_instances:
                result['valid'] = False
                result['details']['vulnerabilities_without_instances'] = vulnerabilities_without_instances

                # Create error message with vulnerability names
                vuln_names = [v['vulnerabilityname'] for v in vulnerabilities_without_instances]
                result['errors'].append(
                    "The following vulnerabilities have no instances: %s" % ", ".join(vuln_names)
                )

        # Log successful validation or errors
        if result['valid']:
            logger.info("Project %s passed completeness validation", project_id)
        else:
            logger.warning("Project %s failed completeness validation: %s",
                          project_id, result['errors'])

    except ObjectDoesNotExist:
        result['valid'] = False
        result['errors'].append("Project with ID %s does not exist" % project_id)
        logger.error("validate_project_completeness: Project %s not found", project_id)
    except Exception as e:
        result['valid'] = False
        result['errors'].append("Error validating project: %s" % str(e))
        logger.error("Error validating project %s: %s", project_id, str(e))

    return result