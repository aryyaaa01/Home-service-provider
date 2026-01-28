"""
Custom permission classes for role-based access control.
"""
from rest_framework.permissions import BasePermission

from .models import User


class IsAdminUserRole(BasePermission):
    """
    Permission class to allow access only to users with ADMIN role.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_ADMIN
        )


class IsWorkerUserRole(BasePermission):
    """
    Permission class to allow access only to approved WORKER users.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_WORKER
            and request.user.is_approved
        )


class IsRegularUserRole(BasePermission):
    """
    Permission class to allow access only to regular USER role.
    """
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.ROLE_USER
        )
