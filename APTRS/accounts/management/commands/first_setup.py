import subprocess

from accounts.models import CustomGroup, CustomPermission, CustomUser
from customers.models import Company
from configapi.models import ReportStandard, ProjectType
from django.core.management.base import BaseCommand

USERNAME = "Sourav.Kalal"
EMAIL = "sourav.kalal@aptrs.com"
FullName = "Sourav Kalal"
Number = "+919910000001"
Position = "Security Engineer"
PASSWORD = "I-am-Weak-Password-Please-Change-Me"
COMPANY_NAME = "APTRS PVT"

Required_Permissions = [
  "Manage Users",
  "Manage Projects",
  "Assign Projects",
  "Manage Vulnerability Data",
  "Manage Customer",
  "Manage Company",
  "Manage Configurations"
]

class Command(BaseCommand):
    """
    Custom manage.py command to setup user details for first time installation users
    """
    help = 'Performs first-time setup tasks'

    def handle(self, *args, **options):
        self.check_gtk3()
        self.load_permissions()
        self.create_groups()
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
        Create specified groups in the system and assign permissions based on group_permissions.
        """
        self.stdout.write(self.style.SUCCESS("Creating Groups"))

        group_permissions = {
            "Administrator": CustomPermission.objects.all(),  # Admins get all permissions
            "Managers": [
                "Manage Projects",
                "Assign Projects",
                "Manage Vulnerability Data",
                "Manage Configurations"
            ],
            "User": [
                "Manage Projects",
                "Manage Vulnerability Data"
            ],
            "Project Manager": [
                "Manage Customer",
                "Manage Company",
                "Manage Projects",
                "Assign Projects"
            ]
        }

        for group_name, perms in group_permissions.items():
            custom_group, created = CustomGroup.objects.get_or_create(
                name=group_name,
                defaults={
                    'description': f'{group_name} description'
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"CustomGroup '{group_name}' created successfully."))
            else:
                self.stdout.write(self.style.SUCCESS(f"CustomGroup '{group_name}' already exists."))

            if isinstance(perms, list):
                permissions = CustomPermission.objects.filter(name__in=perms)
            else:
                permissions = perms

            for perm in permissions:
                custom_group.list_of_permissions.add(perm)
                self.stdout.write(self.style.SUCCESS(f"Permission '{perm.name}' assigned to CustomGroup '{group_name}'."))

        self.stdout.write(self.style.SUCCESS("All Groups and Permissions have been created and assigned."))



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
        admin_group = CustomGroup.objects.get_or_create(name='Administrator')[0]

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
