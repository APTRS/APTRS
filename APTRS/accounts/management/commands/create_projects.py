from django.core.management.base import BaseCommand
from project.models import Project
from customers.models import Company
from accounts.models import CustomUser  # Adjust the import according to your app structure
from django.utils import timezone
import random

class Command(BaseCommand):
    help = 'Create 30 projects with random data'

    def handle(self, *args, **kwargs):
        created_projects = []
        companies = Company.objects.all()  # Fetch all companies
        users = CustomUser.objects.all()  # Fetch all users

        if not companies.exists():
            self.stdout.write(self.style.ERROR('No companies found. Please create companies first.'))
            return

        if not users.exists():
            self.stdout.write(self.style.ERROR('No users found. Please create users first.'))
            return

        for i in range(30):
            project_name = f'Project {i + 1}'  # Unique project names
            project_description = f'Description for Project {i + 1}'  # Unique descriptions
            project_type = random.choice(['Web Application', 'Mobile Application', 'API Testing', 'Desktop Application'])
            start_date = timezone.now().date()  # Set start date to today
            end_date = start_date + timezone.timedelta(days=random.randint(30, 180))  # Random end date in the future
            owner = random.choice(users)  # Randomly assign a user as the owner
            company = random.choice(companies)  # Randomly assign a company

            project = Project(
                name=project_name,
                companyname=company,
                description=project_description,
                projecttype=project_type,
                startdate=start_date,
                enddate=end_date,
                owner=owner,
                status='Upcoming',  # Default status can be set here
            )

            project.save()
            created_projects.append(project)

        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(created_projects)} projects.'))
