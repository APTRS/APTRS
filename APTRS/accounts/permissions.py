

from rest_framework.permissions import BasePermission
from .models import Group, CustomPermission
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from functools import wraps




def custom_permission_required(allowed_permissions):
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if request.user.is_superuser:  # Grant all permissions to superuser/admin
                return func(request, *args, **kwargs)

            user_groups = request.user.groups.all()
            for group in user_groups:
                group_permissions = CustomPermission.objects.filter(customgroup=group)
                for permission in group_permissions:
                    if permission.name in allowed_permissions:  # Change 'name' to the actual attribute
                        return func(request, *args, **kwargs)
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        return wrapper
    return decorator