from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse


class AddProjectAPITest(APITestCase):
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
            "owner": "user"
        }
        add_project_url = reverse('Add Project')
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        add_project_response = self.client.post(add_project_url, project_data, format='json')
        self.assertEqual(add_project_response.status_code, status.HTTP_200_OK, "Adding project failed")
