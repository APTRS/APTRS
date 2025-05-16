from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.urls import reverse
from project.models import Project, PrjectScope, Vulnerability, Vulnerableinstance
from accounts.models import CustomPermission, CustomGroup
from customers.models import Company
from django.test import Client
from rest_framework.test import APIClient

class CustomTestClient(Client):
    def request(self, **request):
        request['REMOTE_ADDR'] = '127.0.0.1'
        return super().request(**request)

class AddProjectAPITest(APITestCase):
    def setUp(self):
        """Set up test environment before each test method"""
        self.client = APIClient(REMOTE_ADDR='127.0.0.1')

    def tearDown(self):
        """Clean up after each test method"""
        # Django TestCase automatically rolls back the transaction after each test
        # but we'll explicitly clean up any specific objects if needed
        pass
    @classmethod
    def setUpTestData(cls):
        """Set up data for the whole TestCase"""
        # Create admin user
        User = get_user_model()
        cls.admin_user_data = {
            "full_name": "Admin User",
            "username": "admin",
            "email": "admin@anof.com",
            "is_active": True,
            "number": "+911122445522",
            "is_superuser": True,
            "position": "Admin",
            "password": "admin"
        }
        cls.admin_user = User.objects.create_superuser(**cls.admin_user_data)

        # Create regular staff user
        cls.user_data = {
            "full_name": "User Name",
            "username": "user",
            "email": "user@example.com",
            "is_active": True,
            "number": "+911234567890",
            "is_superuser": False,
            "is_staff": True,
            "position": "Position",
            "password": "password123"
        }
        cls.user = User.objects.create_user(**cls.user_data)

        # Create permissions
        required_permissions = [
            "Manage Users",
            "Manage Projects",
            "Assign Projects",
            "Manage Vulnerability Data",
            "Manage Customer",
            "Manage Company",
            "Manage Configurations"
        ]

        # Create all required permissions in a single query
        for permission_name in required_permissions:
            CustomPermission.objects.get_or_create(
                name=permission_name,
                defaults={'description': permission_name}
            )

        # Create groups with permissions
        group_permissions = {
            "Administrator": CustomPermission.objects.all(),
            "Managers": CustomPermission.objects.filter(name__in=[
                "Manage Projects",
                "Assign Projects",
                "Manage Vulnerability Data",
                "Manage Configurations"
            ]),
            "User": CustomPermission.objects.filter(name__in=[
                "Manage Projects",
                "Manage Vulnerability Data"
            ]),
            "Project Manager": CustomPermission.objects.filter(name__in=[
                "Manage Customer",
                "Manage Company",
                "Manage Projects",
                "Assign Projects"
            ])
        }
        # Create groups
        for group_name, perms in group_permissions.items():
            group, created = CustomGroup.objects.get_or_create(
                name=group_name,
                defaults={'description': f'{group_name} description'}
            )
            if created and isinstance(perms, list):
                # If perms is a list of strings
                perm_objects = CustomPermission.objects.filter(name__in=perms)
                group.list_of_permissions.set(perm_objects)
            elif created:
                # If perms is already a queryset of permission objects
                group.list_of_permissions.set(perms)

        # Create company
        Company.objects.get_or_create(name='OWASP', defaults={'address': 'USA'})

        # Note: We will not create project data here as it's better to create fresh for each test

    def login_user(self, user_data):
        """Helper method to log in a user and get an access token"""
        login_url = reverse('token_obtain_pair')
        login_data = {
            "email": user_data['email'],
            "password": user_data['password']
        }
        login_response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK,
                        f"User login failed: {login_response.content.decode('utf-8')}")
        return login_response.data.get('access', '')

    def test_add_company(self):
        """Test adding a company"""
        token = self.login_user(self.admin_user_data)
        add_company_url = reverse('Add Company')
        company_data = {'name': 'OWASP_test', 'address': 'USA'}
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        add_company_response = self.client.post(add_company_url, company_data, format='json')
        self.assertEqual(add_company_response.status_code, status.HTTP_200_OK,
                        f"Adding company failed: {add_company_response.content.decode('utf-8')}")
        print("Company added successfully")

        # Verify company was created
        self.assertTrue(Company.objects.filter(name='OWASP_test').exists(),
                       "Company was not created in the database")
        return add_company_response.data

    def test_add_project_with_owner(self):
        token = self.login_user(self.admin_user_data)
        company_exists = Company.objects.filter(name="OWASP_test").exists()
        if not company_exists:
            self.test_add_company()
        project_data = {
            "name": "Juice Shop2",
            "description": "The project is about Juice Shop application security assessment.",
            "projecttype": "Web Application Penetration Testing",
            "startdate": "2024-10-26",
            "enddate": "2024-10-31",
            "companyname": "OWASP",
            "testingtype": "Black Box",
            "projectexception": "",
            "owner": ["user"]
        }
        add_project_url = reverse('Add Project')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        add_project_response = self.client.post(add_project_url, project_data, format='json')
        self.assertEqual(add_project_response.status_code, status.HTTP_200_OK, "Adding project failed")
        project_id = add_project_response.data.get('id')
        self._add_project_scope(token, project_id)

    def _add_project_scope(self, token, project_id):
        add_scope_url = reverse('Add Project Scope', kwargs={'pk': project_id})
        scope_data = [
            {
                "scope": "https://api.aptrs.com",
                "description": "APTRS Test"
            }
        ]
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post(add_scope_url, scope_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK, "Adding project scope failed")

        self._add_vulnerability(token, project_id)

    def _add_vulnerability(self, token, project_id):
        """Helper method to add a vulnerability to a project"""
        add_vulnerability_url = reverse('Add vulnerability')
        vulnerability_data = {
            "vulnerabilityname": "SQL Injection",
            "vulnerabilityseverity": "High",
            "cvssscore": 8.5,
            "cvssvector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L",
            "status": "Vulnerable",
            "vulnerabilitydescription": "<p>SQL Injection vulnerability allows attackers to execute arbitrary SQL commands</p>",
            "POC": "<p>Test proof of concept</p>",
            "vulnerabilitysolution": "<p>Use parameterized queries and input validation</p>",
            "vulnerabilityreferlnk": "<p>See OWASP guidelines</p>",
            "published": True,
            "project": project_id,
            "instance": [
                {
                    "URL": "https://api.aptrs.com/users",
                    "Parameter": "id",
                    "status": "Vulnerable"
                },
                {
                    "URL": "https://api.aptrs.com/products",
                    "Parameter": "category",
                    "status": "Vulnerable"
                }
            ]
        }
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post(add_vulnerability_url, vulnerability_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED,
                        f"Adding vulnerability failed: {response.content.decode('utf-8')}")
        return response.data

    def test_generate_report(self):
        """Test report generation for different formats"""
        # Login as admin user
        token = self.login_user(self.admin_user_data)
        self.client = APIClient(REMOTE_ADDR='127.0.0.1')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        # Create test data directly in the database to avoid API dependencies
        user = get_user_model().objects.get(username="user")
        admin_user = get_user_model().objects.get(username="admin")

        # Make sure user has a company
        company = Company.objects.get(name="OWASP")
        user.company = company
        user.save()

        # Make sure admin user has a company
        admin_user.company = company
        admin_user.save()

        print(f"User: {user.id}, Company: {company.id}, Admin: {admin_user.id}")

        # Create project with required data for report generation
        project = Project.objects.create(
            name="Report Test Project",
            description="<p>Project created for testing report generation</p>",
            projecttype="Web Application Penetration Testing",
            startdate=timezone.now().date(),
            enddate=timezone.now().date() + timezone.timedelta(days=30),
            companyname=company,
            testingtype="Black Box",
            projectexception="",
            status="Open",
            standard=["OWASP Top 10 web", "OWASP Top 10 API", "NIST"]
        )

        # Add owner to project
        project.owner.add(user)
        project.save()

        # Add multiple scopes to the project - required for report generation
        scopes_data = [
            {"scope": "https://api.aptrs.com", "description": "API Test Scope"},
            {"scope": "https://web.aptrs.com", "description": "Web Test Scope"}
        ]
        for scope_data in scopes_data:
            PrjectScope.objects.create(
                project=project,
                scope=scope_data["scope"],
                description=scope_data["description"]
            )

        # Add multiple vulnerabilities with instances to the project
        vulnerabilities_data = [
            {
                "name": "SQL Injection",
                "severity": "High",
                "score": 8.5,
                "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L",
                "status": "Vulnerable",  # Using 'Vulnerable' instead of 'Accepted Risk'
                "description": "<p>SQL Injection vulnerability allows attackers to execute arbitrary SQL commands</p>",
                "poc": "<p>Test proof of concept</p>",
                "solution": "<p>Use parameterized queries and input validation</p>",
                "references": "<p>See OWASP guidelines</p>",
                "instances": [
                    {"url": "https://api.aptrs.com/users", "param": "id", "status": "Vulnerable"},
                    {"url": "https://api.aptrs.com/products", "param": "category", "status": "Vulnerable"}
                ]
            },
            {
                "name": "Cross-Site Scripting (XSS)",
                "severity": "Medium",
                "score": 6.5,
                "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N",
                "status": "Vulnerable",
                "description": "<p>XSS vulnerability allows attackers to inject malicious scripts</p>",
                "poc": "<p>Test XSS proof of concept</p>",
                "solution": "<p>Use proper output encoding and CSP</p>",
                "references": "<p>See OWASP XSS Prevention Cheat Sheet</p>",
                "instances": [
                    {"url": "https://web.aptrs.com/search", "param": "query", "status": "Vulnerable"}
                ]
            }
        ]

        # Create vulnerabilities and their instances
        for vuln_data in vulnerabilities_data:
            # Create vulnerability
            vulnerability = Vulnerability.objects.create(
                project=project,
                vulnerabilityname=vuln_data["name"],
                vulnerabilityseverity=vuln_data["severity"],
                cvssscore=vuln_data["score"],
                cvssvector=vuln_data["vector"],
                status=vuln_data["status"],
                vulnerabilitydescription=vuln_data["description"],
                POC=vuln_data["poc"],
                vulnerabilitysolution=vuln_data["solution"],
                vulnerabilityreferlnk=vuln_data["references"],
                created_by=user,
                last_updated_by=user,
                published=True  # Ensure vulnerability is published
            )

            # Create instances for this vulnerability
            for instance_data in vuln_data["instances"]:
                Vulnerableinstance.objects.create(
                    vulnerabilityid=vulnerability,
                    project=project,
                    URL=instance_data["url"],
                    Parameter=instance_data["param"],
                    status=instance_data["status"]
                )

        # Verify the project exists in the database before proceeding
        project_id = project.id
        self.assertTrue(Project.objects.filter(id=project_id).exists(),
                        f"Project with ID {project_id} does not exist in the database")

        # Verify scopes exist
        self.assertTrue(PrjectScope.objects.filter(project_id=project_id).exists(),
                        f"Scopes for project ID {project_id} do not exist in the database")

        # Verify vulnerabilities exist
        self.assertTrue(Vulnerability.objects.filter(project_id=project_id).exists(),
                        f"Vulnerabilities for project ID {project_id} do not exist in the database")

        # Verify instances exist
        self.assertTrue(Vulnerableinstance.objects.filter(project_id=project_id).exists(),
                        f"Vulnerability instances for project ID {project_id} do not exist in the database")

        # Check vulnerability count
        vuln_count = Vulnerability.objects.filter(project_id=project_id).count()
        self.assertEqual(vuln_count, len(vulnerabilities_data),
                         f"Expected {len(vulnerabilities_data)} vulnerabilities, found {vuln_count}")

        # Check vulnerability instances count
        expected_instance_count = sum(len(v["instances"]) for v in vulnerabilities_data)
        instance_count = Vulnerableinstance.objects.filter(project_id=project_id).count()
        self.assertEqual(instance_count, expected_instance_count,
                         f"Expected {expected_instance_count} vulnerability instances, found {instance_count}")

        # Test report generation for different formats
        report_formats = ['excel', 'pdf', 'docx']
        for report_format in report_formats:
            # Re-authenticate for each request to ensure the token is valid
            token = self.login_user(self.admin_user_data)
            self.client = APIClient(REMOTE_ADDR='127.0.0.1')
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

            # Use the project ID from the newly created project
            report_url = f"/api/project/report/{project_id}/?Format={report_format}&Type=Audit"
            print(f"Testing {report_format} report generation for project ID {project_id}")

            response = self.client.get(report_url)
              # Print more information for debugging
            print(f"Report generation response status: {response.status_code}")
            if response.status_code != status.HTTP_200_OK:
                # For error responses, attempt to decode as UTF-8 only if it's likely to be text
                try:
                    error_content = response.content.decode('utf-8')
                    print(f"Response content: {error_content}")
                except UnicodeDecodeError:
                    print("Response contains binary data that cannot be decoded as UTF-8")

            self.assertEqual(response.status_code, status.HTTP_200_OK,
                             f"Generating {report_format} report failed with status code {response.status_code}")
            print(f"Report is generated successfully: {report_format}")
