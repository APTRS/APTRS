from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from project.models import Project
from django.test import Client
from rest_framework.test import APIClient
from urllib.parse import urlencode

class CustomTestClient(Client):
    def request(self, **request):
        request['REMOTE_ADDR'] = '127.0.0.1'
        return super().request(**request)

class AddProjectAPITest(APITestCase):

    def setUp(self):
        client = APIClient(REMOTE_ADDR='127.0.0.1')


    @classmethod
    def setUpTestData(cls):
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



    def login_user(self, user_data):
        login_url = reverse('token_obtain_pair')
        login_data = {
            "email": user_data['email'],
            "password": user_data['password']
        }
        login_response = self.client.post(login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK, "User login failed")
        return login_response.data.get('access', '')

    def test_add_company(self):
        token = self.login_user(self.admin_user_data)
        add_company_url = reverse('Add Company')
        company_data = {'name': 'OWASP', 'address': 'USA'}
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        add_company_response = self.client.post(add_company_url, company_data, format='json')
        self.assertEqual(add_company_response.status_code, status.HTTP_200_OK, "Adding company failed")

    def test_add_project_with_owner(self):
        token = self.login_user(self.admin_user_data)
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
        project_id = Project.objects.latest('id').id
        self._add_project_scope(token, project_id)


    def _add_project_scope(self, token, project_id):
        add_scope_url = reverse('Add Project Scope', kwargs={'pk': project_id})
        scope_data = [
            {
                "scope": "https://aptrs.com",
                "description": "APTRS Test"
            }
        ]
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post(add_scope_url, scope_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK, "Adding project scope failed")


    def test_add_vulnerability(self):
        token = self.login_user(self.admin_user_data)
        self.test_add_project_with_owner()
        project_id = Project.objects.latest('id').id

        self._add_vulnerability(token, project_id)


    def _add_vulnerability(self, token, project_id):
        add_vulnerability_url = reverse('Add vulnerability')
        vulnerability_data = {
            "vulnerabilityname": "XSS",
            "vulnerabilityseverity": "None",
            "cvssscore": 0.0,
            "cvssvector": "CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:N/I:N/A:N",
            "status": "Accepted Risk",
            "vulnerabilitydescription": "<p>Information disclosure, also known as information leakage, is when a website unintentionally reveals sensitive information to its users. Depending on the context, websites may leak all kinds of information to a potential attacker, including:</p>\\n\\n<ul>\\n\\t<li>Data about other users, such as usernames or financial information</li>\\n\\t<li>Sensitive commercial or business data</li>\\n\\t<li>Technical details about the website and its infrastructure</li>\\n</ul>\\n\\n<p>The dangers of leaking sensitive user or business data are fairly obvious, but disclosing technical information can sometimes be just as serious. Although some of this information will be of limited use, it can potentially be a starting point for exposing an additional attack surface, which may contain other interesting vulnerabilities. The knowledge that you can gather could even provide the missing piece of the puzzle when trying to construct complex, high-severity attacks.</p>",
            "POC": "test",
            "vulnerabilitysolution": "<p>Preventing information disclosure completely is tricky due to the huge variety of ways in which it can occur. However, there are some general best practices that you can follow to minimize the risk of athese kinds of vulnerability creeping into your own websites.</p>\\n\\n<ul>\\n\\t<li>Make sure that everyone involved in producing the website is fully aware of what information is considered sensitive. Sometimes seemingly harmless information can be much more useful to an attacker than people realize. Highlighting these dangers can help make sure that sensitive information is handled more securely in general by your organization.</li>\\n\\t<li>Audit any code for potential information disclosure as part of your QA or build processes. It should be relatively easy to automate some of the associated tasks, such as stripping developer comments.</li>\\n\\t<li>Use generic error messages as much as possible.</li>",
            "vulnerabilityreferlnk": "Another Ckedior",
            "project": project_id,
            "instance": [
                {
                    "URL": "http://10.10.165.234/#/search",
                    "Parameter": "",
                    "status": "Confirm Fixed"
                },
                {
                    "URL": "http://10.10.14.68/ftp/coupons_2013.md.bak",
                    "Parameter": "",
                    "status": "Accepted Risk"
                }
            ]
        }
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = self.client.post(add_vulnerability_url, vulnerability_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"Adding vulnerability failed {response.data}")



    def test_generate_docx_report(self):
        token = self.login_user(self.admin_user_data)
        self.test_add_project_with_owner()
        project_id = Project.objects.latest('id').id
        self._add_vulnerability(token, project_id)

        report_data = {
            "Format": "docx",
            "Type": "Audit",
            "Standard": ["OWASP Top 10 web", "OWASP Top 10 API", "NIST"]
        }

        self.generate_report(token, project_id, report_data)

    def test_generate_pdf_report(self):
        token = self.login_user(self.admin_user_data)
        self.test_add_project_with_owner()
        project_id = Project.objects.latest('id').id
        self._add_vulnerability(token, project_id)

        report_data = {
            "Format": "pdf",
            "Type": "Audit",
            "Standard": ["OWASP Top 10 web", "OWASP Top 10 API", "NIST"]
        }

        self.generate_report(token, project_id, report_data)

    def test_generate_excel_report(self):
        token = self.login_user(self.admin_user_data)
        self.test_add_project_with_owner()
        project_id = Project.objects.latest('id').id
        self._add_vulnerability(token, project_id)

        report_data = {
            "Format": "excel",
            "Type": "Audit",
            "Standard": ["OWASP Top 10 web", "OWASP Top 10 API", "NIST"]
        }

        self.generate_report(report_data)



    def generate_report(self, report_data):
        token = self.login_user(self.admin_user_data)
        self.test_add_project_with_owner()
        project_id = Project.objects.latest('id').id
        self._add_vulnerability(token, project_id)
        query_params = {
        "Format": report_data["Format"],
        "Type": report_data["Type"],
        "Standard": ",".join(report_data["Standard"]),
        }
        generate_report_url = reverse('generate report', kwargs={'pk': project_id})
        generate_report_url_with_params = f"{generate_report_url}?{urlencode(query_params)}"
        self.client = APIClient(REMOTE_ADDR='127.0.0.1')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        #response = self.client.post(generate_report_url, report_data, format='json')
        response = self.client.get(generate_report_url_with_params)

        self.assertEqual(response.status_code, status.HTTP_200_OK, "Generating report failed")

