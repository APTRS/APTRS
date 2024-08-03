from django.db import models

# Create your models here.
class Company(models.Model):
    name = models.CharField(max_length=300,unique = True)
    img = models.ImageField(upload_to='company')
    address = models.TextField()
    internal = models.BooleanField(default=False)

    ### Internal company cannot be deleted, Deleting this remove all users, projects etc.
    def delete(self, *args, **kwargs):
        if not self.internal:
            super(Company, self).delete(*args, **kwargs)
        else:
            print(f"Attempt to delete internal company '{self.name}' ignored.")
