"""
URL configuration for home_service project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # All API endpoints are under /api/
    path("api/", include("core.urls")),
]
