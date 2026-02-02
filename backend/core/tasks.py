from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from .models import Booking, UserProfile
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_otp_email(self, booking_id, otp_code, worker_username, user_email, user_username):
    """
    Send OTP email to user asynchronously
    """
    try:
        logger.info(f"Sending OTP email for booking {booking_id}")

        subject = 'OTP for Your Service Completion'
        message = f'''Hello {user_username},

Your service has been completed by {worker_username}.

Booking ID: {booking_id}
OTP code: {otp_code}

Please share this OTP with the worker to complete the job.

Thank you for using our service!'''

        email_from = getattr(settings, 'DEFAULT_FROM_EMAIL',
                             'noreply@homeservice.com')
        recipient_list = [user_email]

        send_mail(subject, message, email_from,
                  recipient_list, fail_silently=False)

        logger.info(f"OTP email sent successfully for booking {booking_id}")
        return f"OTP email sent to {user_email}"

    except Exception as exc:
        logger.error(
            f"Failed to send OTP email for booking {booking_id}: {str(exc)}")
        # Retry the task with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@shared_task
def send_notification_email(user_email, subject, message):
    """
    Send general notification email to user
    """
    try:
        email_from = getattr(settings, 'DEFAULT_FROM_EMAIL',
                             'noreply@homeservice.com')
        recipient_list = [user_email]

        send_mail(subject, message, email_from,
                  recipient_list, fail_silently=False)
        logger.info(f"Notification email sent to {user_email}")
        return f"Notification email sent to {user_email}"

    except Exception as exc:
        logger.error(
            f"Failed to send notification email to {user_email}: {str(exc)}")
        return f"Failed to send notification email: {str(exc)}"


@shared_task
def check_and_mark_delayed_bookings():
    """
    Periodic task to check for bookings that should have been marked as 'Reached'
    but weren't, and automatically mark them as 'Delayed'
    """
    from django.utils import timezone
    from django.contrib.auth.models import User
    from django.db.models import Q
    from .models import Notification, Booking
    from datetime import timedelta, datetime

    try:
        # Get current time in UTC
        now = timezone.now()
        logger.info(f"Starting delayed booking check at {now}")

        # Only check bookings that are CONFIRMED (ASSIGNED is not a valid status)
        bookings_to_check = Booking.objects.filter(
            status='CONFIRMED',
            worker__isnull=False  # Worker must be assigned
        )

        logger.info(f"Found {bookings_to_check.count()} CONFIRMED bookings to check")
        delayed_count = 0

        for booking in bookings_to_check:
            try:
                # Combine date and time_slot to create a datetime object
                # time_slot format: "9:00 AM - 11:00 AM" or "12:00" (24-hour)
                time_slot_start = booking.time_slot.split(' - ')[0].strip()
                time_parts = time_slot_start.split()
                time_str = time_parts[0]  # Get the time part like "9:00" or "12:00"
                
                # Parse hour and minute
                hour, minute = map(int, time_str.split(':'))
                
                # Check if AM/PM is present
                if len(time_parts) > 1:
                    # 12-hour format with AM/PM
                    am_pm = time_parts[1].upper()
                    
                    if am_pm == 'PM':
                        if hour != 12:
                            hour += 12
                    elif am_pm == 'AM':
                        if hour == 12:
                            hour = 0
                
                # Create a timezone-aware datetime combining the booking date with the scheduled time
                # Assuming bookings are in the system's default timezone
                scheduled_time = datetime.min.time().replace(hour=hour, minute=minute)
                naive_datetime = datetime.combine(booking.date, scheduled_time)
                
                # Make it timezone-aware (use UTC for now, can be changed based on user timezone)
                scheduled_datetime = timezone.make_aware(naive_datetime, timezone.utc)

                # Check if scheduled time has passed and booking hasn't been marked as reached
                # Give a grace period of 15 minutes
                if now > scheduled_datetime + timedelta(minutes=15):
                    logger.info(f"Booking {booking.id} marked as DELAYED. Scheduled: {scheduled_datetime}, Now: {now}")
                    
                    # Update booking status to DELAYED
                    booking.status = 'DELAYED'
                    booking.save()

                    # Create notification for admin
                    # Get all admin users (both superusers and users with ADMIN role)
                    admin_users = User.objects.filter(
                        Q(is_superuser=True) |
                        Q(userprofile__role='ADMIN')
                    ).distinct()

                    for admin_user in admin_users:
                        Notification.objects.create(
                            user=admin_user,
                            title='Booking Delayed - Worker Did Not Reach On Time',
                            message=f'Worker did not reach on time for booking #{booking.id} ({booking.service.name}). Service is delayed.',
                            notification_type='SYSTEM'
                        )

                    delayed_count += 1

            except Exception as e:
                logger.error(f"Error processing booking {booking.id}: {str(e)}")
                continue

        logger.info(f"Checked for delayed bookings. {delayed_count} bookings marked as delayed.")
        return f"{delayed_count} bookings marked as delayed."

    except Exception as exc:
        logger.error(f"Failed to check for delayed bookings: {str(exc)}")
        return f"Failed to check for delayed bookings: {str(exc)}"
