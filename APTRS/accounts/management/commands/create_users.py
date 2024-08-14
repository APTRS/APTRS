from django.core.management.base import BaseCommand
from accounts.models import CustomUser  # Adjust the import to your actual user model and Company model
from customers.models import Company
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Create 30 users with a hardcoded password and assign the first internal company'

    def handle(self, *args, **kwargs):
        password = 'hardcoded_password'  # Your hardcoded password
        created_users = []

        # Get the first internal company
        try:
            company = Company.objects.filter(internal=True).first()
            if not company:
                self.stdout.write(self.style.ERROR('No internal company found.'))
                return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching internal company: {e}'))
            return

        for i in range(30):
            username = f'user{i + 1}'  # Create unique usernames
            email = f'user{i + 1}@example.com'  # Create unique emails
            
            user = CustomUser(
                username=username,
                email=email,
                password=make_password(password),  # Hash the password
                full_name=f'User {i + 1}',
                company=company  # Assign the first internal company
            )
            user.save()
            created_users.append(user)

        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(created_users)} users with the first internal company.'))
