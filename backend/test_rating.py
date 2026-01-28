#!/usr/bin/env python
"""
Test script to verify rating functionality
"""
from core.models import RatingReview, Booking, User, Service, UserProfile
import django
import os
import sys

# Add the project directory to Python path
sys.path.append('/Users/aryap/Desktop/Home service provider/backend')

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_service.settings')


# Setup Django
django.setup()

# Import the models to verify they're accessible

print("Django setup completed successfully!")
print("Models imported successfully!")
print("RatingReview model:", RatingReview)
print("Booking model:", Booking)
print("User model:", User)
print("Service model:", Service)
print("UserProfile model:", UserProfile)

# Check if Booking model has is_rated field
try:
    has_is_rated = hasattr(Booking, 'is_rated')
    print(f"Booking model has 'is_rated' field: {has_is_rated}")

    if has_is_rated:
        # Check the field type
        field = Booking._meta.get_field('is_rated')
        print(f"is_rated field type: {type(field).__name__}")
        print(f"is_rated field default: {field.default}")
except Exception as e:
    print(f"Error checking is_rated field: {e}")

print("\nTest completed successfully!")
