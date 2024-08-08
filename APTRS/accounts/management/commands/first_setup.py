import os
import subprocess

from accounts.models import CustomGroup, CustomPermission, CustomUser
from customers.models import Company
from configapi.models import ReportStandard, ProjectType
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand

USERNAME = "Sourav.Kalal"
EMAIL = "sourav.kalal@anof.com"
FullName = "Sourav Kalal"
Number = "+919910000001"
Position = "Security Engineer"
PASSWORD = "I-am-Weak-Password-Please-Change-Me"
COMPANY_NAME = "APTRS PVT"

Required_Permissions = [
  "Permission to manage users",
  "Permission to manage projects",
  "Permission to assign projects",
  "Permission to manage vulnerability data",
  "Permission to manage customer data",
  "Permission to manage company data",
  "Permission to manage configurations"
]

Required_Groups = ["Administrator", "Project Mananger", "Manangers", "User"]


class Command(BaseCommand):
    """
    Custom manage.py command to setup user details for first time installation users
    """
    help = 'Performs first-time setup tasks'

    def handle(self, *args, **options):
        self.check_gtk3()
        self.load_permissions()
        self.create_groups()
        self.assign_permissions_to_groups()
        self.create_company()
        self.create_super_user()
        self.create_report_standards()
        self.create_project_types()

        self.stdout.write(self.style.SUCCESS("Django Setup is completed successfully."))
        self.stdout.write(self.style.SUCCESS(
            f"USERNAME={USERNAME}\n"
            f"Password={PASSWORD}\n"
            f"Email={EMAIL}"
        ))


    def load_permissions(self):
        """Load the default permissions, Permissions are used for Each APIs access control.
        """
        for permission_name in Required_Permissions:
            CustomPermission.objects.get_or_create(name=permission_name,defaults={'description': permission_name})
        self.stdout.write(self.style.SUCCESS("All permissions were successfully loaded"))



    def create_groups(self):
        """
        Create specified groups in the system.
        """
        self.stdout.write(self.style.SUCCESS("Creating Groups"))
        for group_name in Required_Groups:
            # Check if the group exists in the Group model
            group, group_created = Group.objects.get_or_create(name=group_name)

            self.stdout.write(self.style.SUCCESS("Creating Custom Groups"))
            
            # Create CustomGroup related to the Group
            custom_group, custom_group_created = CustomGroup.objects.get_or_create(
                group=group,
                defaults={
                    'description': f'{group_name} description'  # or any default description
                }
            )
            
            if custom_group_created:
                self.stdout.write(
                    self.style.SUCCESS(f"CustomGroup '{group_name}' created successfully.")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f"CustomGroup '{group_name}' already exists.")
                )
        self.stdout.write(self.style.SUCCESS("All Groups Created"))


    def assign_permissions_to_groups(self):
        """Assign permissions to groups based on predefined requirements."""
        # Define permissions for each group
        group_permissions = {
            "Administrator": CustomPermission.objects.all(),  # Admins get all permissions
            "Managers": [
                "Permission to manage projects",
                "Permission to assign projects",
                "Permission to manage vulnerability data",
                "Permission to manage configurations"
            ],
            "User": [
                "Permission to manage projects",
                "Permission to manage vulnerability data"
            ],
            "Project Manager": [
                "Permission to manage customer data",
                "Permission to manage company data",
                "Permission to manage projects",
                "Permission to assign projects"
            ]
        }

        for group_name, permissions in group_permissions.items():
            try:
                # Retrieve the corresponding CustomGroup instance
                custom_group = CustomGroup.objects.get(group__name=group_name)
                
                if isinstance(permissions, list):
                    # Get permissions by name
                    permissions_objects = CustomPermission.objects.filter(name__in=permissions)
                else:
                    # If permissions is not a list, assume it is a queryset
                    permissions_objects = permissions
                
                # Assign permissions to the group
                custom_group.list_of_permissions.set(permissions_objects)
                
                # Save the CustomGroup instance if needed (depends on your setup)
                custom_group.save()
                
                self.stdout.write(self.style.SUCCESS(f"Permissions assigned to '{group_name}' group"))

            except CustomGroup.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"CustomGroup with group name '{group_name}' does not exist"))

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"An error occurred: {str(e)}"))




    def create_company(self):
        company, created = Company.objects.get_or_create(name=COMPANY_NAME, defaults={'internal': True})
        if created:
            self.stdout.write(self.style.SUCCESS(f'Company "{COMPANY_NAME}" created with internal=True.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Company "{COMPANY_NAME}" already exists with internal={company.internal}.'))



    def create_super_user(self):
        """
        Create a new super admin user and add user to Administrator Group
        """
        admin_group = CustomGroup.objects.get_or_create(group__name='Administrator')[0]

        # Ensure the company exists
        company, _ = Company.objects.get_or_create(name=COMPANY_NAME)
        if not CustomUser.objects.filter(username=USERNAME).exists():
            user = CustomUser.objects.create(
                username=USERNAME,
                email=EMAIL,
                company=company,
                full_name=FullName,
                is_active=True,
                number=Number,
                position=Position,
                is_staff=True,
                is_superuser=True
            )
            user.set_password(PASSWORD)
            user.save()
            user.groups.set([admin_group])
            self.stdout.write(self.style.SUCCESS("Superuser created successfully"))
        else:
            self.stdout.write(self.style.NOTICE("Superuser already exists"))

    def create_report_standards(self):
        """Create predefined report standards."""
        report_standards = [
            "OWASP Mobile TOP 10 2016",
            "OWASP TOP 10 2017",
            "OWASP TOP 10 2021",
            "OWASP Mobile TOP 10 2024",
            "NIST SP 800-115",
            "NIST SP 800-53",
            "NIST SP 800-153"
        ]
        
        for name in report_standards:
            _, created = ReportStandard.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'ReportStandard "{name}" created successfully.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'ReportStandard "{name}" already exists.'))

    def create_project_types(self):
        """Create predefined project types."""
        project_types = [
            "Web Application Penetration Testing",
            "Android Application Penetration Testing",
            "iOS Application Penetration Testing",
            "External Network Penetration Testing",
            "Internal Network Penetration Testing"
        ]
        
        for name in project_types:
            _, created = ProjectType.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f'ProjectType "{name}" created successfully.'))
            else:
                self.stdout.write(self.style.SUCCESS(f'ProjectType "{name}" already exists.'))
   
    def check_gtk3(self):
        """
        Check if GTK3 is available or not, pdf generation library weasyprint requires GTK3.
        """
        try:
            subprocess.run(
                ['gtk-update-icon-cache', '--help'],
                capture_output=True,
                text=True,
                check=True
            )
            self.stdout.write(self.style.SUCCESS("GTK3 Found"))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR("GTK3 is not installed or not in the PATH"))
