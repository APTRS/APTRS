from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse

class AuthAPITest(APITestCase):
    def setUp(self):
        User = get_user_model()
        # Create a superuser
        self.user_data = {
            "full_name": "admin User",
            "username": "admin",
            "email": "admin@anof.com",
            "is_active": True,
            "number": "+911122445522",
            "is_superuser": True,
            "position": "Security Engineer",
            "password": "admin"
        }

        self.user = User.objects.create_superuser(**self.user_data)

    def test_login_as_superuser(self):
        # Test login API using the superuser's credentials
        login_url = reverse('token_obtain_pair')  # Replace 'login' with the actual URL name of your login endpoint
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        login_response = self.client.post(login_url, login_data, format='json')

        # Check if the login was successful (HTTP status code 200)
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
