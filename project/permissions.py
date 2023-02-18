from rest_framework import permissions
from rest_framework.permissions import BasePermission, IsAuthenticated, SAFE_METHODS

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return True

    def has_object_permission(self, request, view, obj):

        if request.user.is_superuser:
            return True
        elif obj.owner == request.user:
            return True

        return False