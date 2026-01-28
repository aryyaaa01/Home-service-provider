from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('USER', 'User'),
        ('WORKER', 'Worker'),
        ('ADMIN', 'Admin'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(
        max_length=15,
        validators=[RegexValidator(
            regex=r'^\d{10}$', message='Phone number must be 10 digits')]
    )
    role = models.CharField(
        max_length=10, choices=ROLE_CHOICES, default='USER')
    specialty = models.CharField(max_length=100, blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    address = models.TextField(blank=True, null=True)
    services = models.ManyToManyField(
        'Service', blank=True, related_name='workers')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Service(models.Model):
    CATEGORY_CHOICES = [
        ('CLEANING', 'Cleaning'),
        ('ELECTRICIAN', 'Electrician'),
        ('PLUMBING', 'Plumbing'),
        ('CARPENTRY', 'Carpentry'),
        ('PAINTING', 'Painting'),
        ('OTHER', 'Other'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_duration = models.CharField(
        max_length=50)  # e.g., "1 hour", "2-3 hours"
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default='OTHER')
    included_items = models.TextField(
        blank=True, null=True, help_text='JSON array of items included in the service')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def average_rating(self):
        """Calculate the average rating for this service based on all RatingReview entries"""
        from django.db.models import Avg
        # Get ratings directly linked to this service
        direct_ratings = RatingReview.objects.filter(service=self)
        # Also get ratings linked through bookings that have this service
        booking_ratings = RatingReview.objects.filter(booking__service=self)
        # Combine both querysets and calculate average
        all_ratings = direct_ratings | booking_ratings
        result = all_ratings.aggregate(Avg('rating'))
        return result['rating__avg'] or 0.0


class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('IN_PROGRESS', 'In Progress'),
        ('REACHED', 'Reached'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('DELAYED', 'Delayed'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='bookings')
    worker = models.ForeignKey(UserProfile, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='assigned_bookings')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    date = models.DateField()
    # e.g., "9:00 AM - 11:00 AM"
    time_slot = models.CharField(max_length=20, default="9:00 AM - 11:00 AM")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='PENDING')
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Fields for delayed service suggestions
    suggested_date = models.DateField(null=True, blank=True)
    suggested_time = models.CharField(max_length=20, null=True, blank=True)
    # Track if the booking has been rated
    is_rated = models.BooleanField(default=False)
    # Track when the worker reached
    reached_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Booking {self.id} - {self.user.username} - {self.service.name}"


class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Link OTP to a specific booking
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, null=True, blank=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"OTP {self.code} for {self.user.username}"


class RatingReview(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='given_ratings')
    worker = models.ForeignKey(UserProfile, on_delete=models.CASCADE,
                               related_name='received_ratings', null=True, blank=True)
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, null=True, blank=True)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, null=True, blank=True)
    rating = models.IntegerField(
        choices=[(i, i) for i in range(1, 6)])  # 1 to 5 stars
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Each user can rate a booking only once
        unique_together = ('user', 'booking')

    def __str__(self):
        return f"Rating {self.rating} by {self.user.username} for {self.worker.user.username if self.worker else 'N/A'}"


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('BOOKING_STATUS', 'Booking Status'),
        ('ASSIGNMENT', 'Assignment'),
        ('OTP', 'OTP'),
        ('PAYMENT', 'Payment'),
        ('SYSTEM', 'System'),
        ('BOOKING_REJECTION', 'Booking Rejection'),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({'Read' if self.is_read else 'Unread'})"


class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('CARD', 'Credit/Debit Card'),
        ('UPI', 'UPI'),
        ('NET_BANKING', 'Net Banking'),
        ('WALLET', 'Wallet'),
        ('COD', 'Cash on Delivery'),
    ]

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='payment')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    admin_commission = models.DecimalField(
        max_digits=10, decimal_places=2)  # 20% of total
    provider_amount = models.DecimalField(
        max_digits=10, decimal_places=2)   # 80% of total
    payment_status = models.CharField(
        max_length=10, choices=PAYMENT_STATUS_CHOICES, default='FAILED')
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CARD')
    transaction_id = models.CharField(
        max_length=100, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.id} for Booking {self.booking.id} - {self.payment_status}"
