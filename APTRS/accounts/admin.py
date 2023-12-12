from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, CustomGroup,CustomPermission
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.db import models
from django.contrib.auth.models import Group
from django import forms
from django.contrib.admin.widgets import FilteredSelectMultiple
from django.utils.safestring import mark_safe


# Inline for CustomGroup
class CustomGroupInline(admin.TabularInline):
    model = CustomUser.groups.through
    extra = 1



class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['email', 'full_name', 'is_staff', 'is_active','is_superuser','username','password','position']
    fieldsets = (
        (None, {'fields': ('email', 'password','username')}),
        ('Personal Info', {'fields': ('full_name','position')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser','groups')}),  
    )
    #filter_horizontal = ('groups',) 
    #inlines = (CustomGroupInline,)



class CustomPermissionInline(admin.TabularInline):
    model = CustomGroup.list_of_permissions.through
    extra = 1

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "permission":
            kwargs["queryset"] = CustomPermission.objects.only("name", "description")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class CheckboxSelectMultiple(forms.CheckboxSelectMultiple):
    def render(self, name, value, attrs=None, renderer=None):
        output = super().render(name, value, attrs, renderer)
        return mark_safe(f'<div class="checkbox-select-multiple">{output}</div>')


class CustomGroupAdmin(admin.ModelAdmin):
    model = CustomGroup
    exclude = ('permissions',)
    formfield_overrides = {
        models.ManyToManyField: {'widget': CheckboxSelectMultiple},
    }
    # Register the CustomUser model with the CustomUserAdmin
admin.site.register(CustomUser, CustomUserAdmin)

# Register CustomGroup with its inline admin


admin.site.register(CustomGroup, CustomGroupAdmin)
admin.site.register(CustomPermission)
admin.site.unregister(Group)
