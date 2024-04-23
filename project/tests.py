from django.test import TestCase
from django.urls import reverse
import os
from django.conf import settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
settings.configure()
from django.contrib.auth.models import User
from .models import Vulnerability, Project

class VulnerabilityFunctionsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.project = Project.objects.create(name='Test Project', owner=self.user)
        self.vulnerability = Vulnerability.objects.create(
            title='Test Vulnerability',
            severity='Medium',
            cvss_score=5.0,
            cvss_vector='AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:P/A:N',
            status='Open',
            description='Test description',
            project=self.project
        )

    def test_edit_vulnerability_empty_title(self):
        url = reverse('edit_vulnerability', args=[self.vulnerability.id])
        data = {
            'title': '',
            'severity': 'Medium',
            'cvss_score': 5.0,
            'cvss_vector': 'AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:P/A:N',
            'status': 'Open',
            'description': 'Test description',
        }
        response = self.client.post(url, data)
        self.assertContains(response, 'Vulnerability Title is required.')

    def test_add_new_vulnerability_empty_title(self):
        url = reverse('add_new_vulnerability')
        data = {
            'title': '',
            'severity': 'Medium',
            'cvss_score': 5.0,
            'cvss_vector': 'AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:P/A:N',
            'status': 'Open',
            'description': 'Test description',
            'project': self.project.id,
        }
        response = self.client.post(url, data)
        self.assertContains(response, 'Vulnerability Title is required.')

    # Add more test methods for other scenarios