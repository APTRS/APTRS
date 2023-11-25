from django.forms import ModelForm
from .models import Vulnerability


class ProjectVulnerabilityForm(ModelForm):
	class Meta:
		model = Vulnerability
		fields = '__all__'