# Generated by Django 3.2.12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('project', '0010_migrate_projectretest_status_data'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='projectretest',
            name='status',
        ),
    ]