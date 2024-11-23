from django.db import models


class ReportStandard(models.Model):
    name = models.CharField(max_length=255)


class ProjectType(models.Model):
    name = models.CharField(max_length=600)