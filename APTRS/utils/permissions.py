from functools import wraps

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import CustomPermission


def custom_permission_required(allowed_permissions):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if hasattr(request, 'user') and request.user.is_superuser:  # Check if user is superuser/admin
                return view_func(request, *args, **kwargs)

            if isinstance(request, APIView):  # Check if it's a class-based view
                user_groups = request.request.user.groups.all()
            else:  # Assume it's a function-based view
                user_groups = request.user.groups.all()

            for group in user_groups:
                group_permissions = CustomPermission.objects.filter(customgroup=group)
                for permission in group_permissions:
                    if permission.name in allowed_permissions:  # Change 'name' to the actual attribute
                        return view_func(request, *args, **kwargs)

            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        return wrapper

    return decorator
