from django.core.management.base import BaseCommand
from accounts.models import CustomUser , CustomGroup, CustomPermission
import subprocess
import json
import os
from dotenv import load_dotenv
from django.conf import settings



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
    help = 'Performs first-time setup tasks'

    def handle(self, *args, **options):
        self.LoadPermissions()
        self.CreateGroup()
        self.CreateSuperUser()
        self.CheckWKHTMLtoPDF()

        self.stdout.write(self.style.SUCCESS("Django Setup is completed successfully."))
        self.stdout.write(self.style.SUCCESS("USERNAME=%s\nPassword=%s\nEmail=%s" % (USERNAME, PASSWORD, EMAIL)))

        


    def LoadPermissions(self):
        Permission_path = '../Dummy-Data/Permission.json'
        with open(Permission_path, 'r') as file:
            data = json.load(file)

        for item in data:
            CustomPermission.objects.create(
            name=item['name'],
            description=item['description']
            )
            
        #call_command('loaddata', Permission_path)

        self.stdout.write(self.style.SUCCESS("All permissions were successfully loaded"))



    def CreateGroup(self):
        admin_group, _ = CustomGroup.objects.get_or_create(name='Administrator')
        all_permissions = CustomPermission.objects.all()
        admin_group.list_of_permissions.set(all_permissions)

        CustomGroup.objects.get_or_create(name='Customer')

        self.stdout.write(self.style.SUCCESS("Administrator and Customer group created with all permission"))


    def CreateSuperUser(self):
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


    def CheckWKHTMLtoPDF(self):

        expected_version = "wkhtmltopdf 0.12.6 (with patched qt)"


        try:
            result = subprocess.run(['wkhtmltopdf', '--version'], capture_output=True, text=True, check=True)
            output = result.stdout.strip()

            if expected_version in output:
                self.stdout.write(self.style.SUCCESS(f"wkhtmltopdf version {expected_version} is installed"))
            else:
                self.stdout.write(self.style.ERROR(f"Installed wkhtmltopdf version: {output}. Expected: {expected_version}, PDF reports will not be generated"))
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR("wkhtmltopdf is not installed or not in the PATH"))