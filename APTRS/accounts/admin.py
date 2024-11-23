from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import Group
from django.db import models
from django.utils.safestring import mark_safe

from .models import CustomGroup, CustomPermission, CustomUser


# Inline for CustomGroup
class CustomGroupInline(admin.TabularInline):
    """
    add Custom Gryop to Django Admin Panel
    """
    model = CustomUser.groups.through
    extra = 1


class CustomUserAdmin(UserAdmin):
    """
    Add Custom User to Django Admin Panel with only required fields.
    """
    model = CustomUser
    list_display = [
                    'email', 'full_name', 'is_staff', 'is_active',
                    'is_superuser','username','password','position'
                ]
    fieldsets = (
        (None, {'fields': ('email', 'password','username')}),
        ('Personal Info', {'fields': ('full_name','position')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser','groups')}),
    )

class CustomPermissionInline(admin.TabularInline):
    """
    Replace Django permission with a custom permission in the admin panel.
    """
    model = CustomGroup.list_of_permissions.through
    extra = 1

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "permission":
            kwargs["queryset"] = CustomPermission.objects.only("name", "description")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class CheckboxSelectMultiple(forms.CheckboxSelectMultiple):
    """
    Create a checkbox for select multiple permissions
    """
    def render(self, name, value, attrs=None, renderer=None):
        output = super().render(name, value, attrs, renderer)
        return mark_safe(f'<div class="checkbox-select-multiple">{output}</div>')


class CustomGroupAdmin(admin.ModelAdmin):
    """Add check box option for permissions UI"""
    model = CustomGroup
    exclude = ('permissions',)
    formfield_overrides = {
        models.ManyToManyField: {'widget': CheckboxSelectMultiple},
    }


# Register the Custom Model for Admin
admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(CustomGroup, CustomGroupAdmin)
admin.site.register(CustomPermission)
admin.site.unregister(Group)
