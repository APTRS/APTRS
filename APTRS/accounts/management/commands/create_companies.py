from django.core.management.base import BaseCommand
from customers.models import Company  # Adjust the import to your actual Company model
from django.core.files.base import ContentFile

class Command(BaseCommand):
    help = 'Create 30 companies with internal set to False'

    def handle(self, *args, **kwargs):
        created_companies = []

        for i in range(30):
            company_name = f'Company {i + 1}'  # Unique company names
            company_address = f'Address for Company {i + 1}'  # Unique addresses
            company_img_name = f'company_{i + 1}.svg'  # Example image name

            # Create a new Company instance
            company = Company(
                name=company_name,
                address=company_address,
                internal=False,  # Set internal to False
            )

            # If you have actual image files, you can load them here
            # For example, to load a placeholder image:
            company.img.save(company_img_name, ContentFile(b'Placeholder image data'), save=True)

            company.save()
            created_companies.append(company)

        self.stdout.write(self.style.SUCCESS(f'Successfully created {len(created_companies)} companies.'))
