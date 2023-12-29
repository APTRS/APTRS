from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse



class AddProjectAPITest(APITestCase):
    def setUp(self):
        User = get_user_model()
        
        # Create an admin user
        self.admin_user_data = {
            "full_name": "Admin User",
            "username": "admin",
            "email": "admin@anof.com",
            "is_active": True,
            "number": "+911122445522",
            "is_superuser": True,
            "position": "Admin",
            "password": "admin"
        }
        self.admin_user = User.objects.create_superuser(**self.admin_user_data)


        self.user_data = {
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
        self.user = User.objects.create_user(**self.user_data)
        


    def login_user(self,userdata):
        login_url = reverse('token_obtain_pair')  # Replace with the actual login URL pattern
        login_data = {
            "email": userdata['email'],
            "password": userdata['password']
        }
        login_response = self.client.post(login_url, login_data, format='json')
        

        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.token = login_response.data.get('access', '')
        return self.token
    



    def test_add_company(self):
        token = self.login_user(self.admin_user_data)

        add_company_url = reverse('Add Company')  
        company_data = {
            'name': 'OWASP',
            'address': 'USA'
           
        }
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        add_company_response = self.client.post(add_company_url, company_data, format='json')

        self.assertEqual(add_company_response.status_code, status.HTTP_200_OK)




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



        self.assertEqual(add_project_response.status_code, status.HTTP_200_OK)

        