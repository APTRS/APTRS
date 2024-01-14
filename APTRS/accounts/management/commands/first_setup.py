import json
import os
import subprocess

from accounts.models import CustomGroup, CustomPermission, CustomUser
from django.conf import settings
from django.core.management.base import BaseCommand
from dotenv import load_dotenv

dotenv_path = os.path.join(settings.BASE_DIR, '.env')
load_dotenv(dotenv_path)

USERNAME = os.getenv('USERNAME')
EMAIL = os.getenv('EMAIL')
FullName = os.getenv('FullName')
Number = os.getenv('Number')
Position = os.getenv('Position')
ADMIN = os.getenv('ADMIN')
PASSWORD = os.getenv('PASSWORD')
Group = os.getenv('Group')



class Command(BaseCommand):
    """
    Custom manage.py command to setup user details for first time installation users
    """
    help = 'Performs first-time setup tasks'

    def handle(self, *args, **options):
        self.load_permissions()
        self.create_group()
        self.create_super_user()
        self.check_gtk3()

        self.stdout.write(self.style.SUCCESS("Django Setup is completed successfully."))
        self.stdout.write(self.style.SUCCESS(
            f"USERNAME={USERNAME}\n"
            f"Password={PASSWORD}\n"
            f"Email={EMAIL}"
        ))


    def load_permissions(self):
        """Load the default permissions, Permissions are used for Each APIs access control.
        """
        permission_path = '../Dummy-Data/Permission.json'
        with open(permission_path, 'r',encoding='utf-8') as file:
            data = json.load(file)

        for item in data:
            CustomPermission.objects.create(
            name=item['name'],
            description=item['description']
            )
        self.stdout.write(self.style.SUCCESS("All permissions were successfully loaded"))



    def create_group(self):
        """
        Create a Default Administrator Group and assign all permissions to it.
        Remember Admin user does not requires any group or permissions.
        All admin users can access any API irrespective of the permissions.
        """
        admin_group, _ = CustomGroup.objects.get_or_create(name='Administrator')
        all_permissions = CustomPermission.objects.all()
        admin_group.list_of_permissions.set(all_permissions)
        CustomGroup.objects.get_or_create(name='Customer')
        self.stdout.write(
            self.style.SUCCESS("Administrator and Customer group created with all permission")
        )



    def create_super_user(self):
        """
        Create a new super admin user and add user to Administrator Group
        """
        admin_group = CustomGroup.objects.get(name=Group)
        if not CustomUser.objects.filter(username=USERNAME).exists():
            user = CustomUser.objects.create(
                username=USERNAME,
                email=EMAIL,
                company=None,
                full_name=FullName,
                is_active=True,
                number=Number,
                position=Position,
                is_staff=True,
                is_superuser=ADMIN
            )
            user.set_password(PASSWORD)
            user.save()
            user.groups.set([admin_group])
            self.stdout.write(self.style.SUCCESS("Superuser created successfully"))
        else:
            self.stdout.write(self.style.NOTICE("Superuser already exists"))


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
