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
    from .models import Notification
    from datetime import timedelta

    try:
        # Get current time
        # Convert to naive datetime for comparison
        now = timezone.now().replace(tzinfo=None)

        # Get bookings with status 'ASSIGNED' or 'CONFIRMED' that are past their scheduled time
        # We need to convert the date and time_slot to a datetime object for comparison
        from django.db.models import F
        from datetime import datetime

        # Loop through all assigned or confirmed bookings
        from .models import Booking
        bookings_to_check = Booking.objects.filter(
            status__in=['ASSIGNED', 'CONFIRMED'])

        delayed_count = 0

        for booking in bookings_to_check:
            # Combine date and time_slot to create a datetime object
            # Assuming time_slot is in format like "9:00 AM - 11:00 AM", we'll use the start time
            time_parts = booking.time_slot.split(
                ' - ')[0].split()  # Get first time part
            time_str = time_parts[0]  # Get the time part like "9:00"
            am_pm = time_parts[1] if len(
                time_parts) > 1 else 'AM'  # Get AM/PM part

            # Parse the time
            hour, minute = map(int, time_str.split(':'))
            if am_pm.upper() == 'PM' and hour != 12:
                hour += 12
            elif am_pm.upper() == 'AM' and hour == 12:
                hour = 0

            # Create a datetime combining the booking date with the scheduled time
            scheduled_datetime = datetime.combine(
                booking.date, datetime.min.time().replace(hour=hour, minute=minute))

            # Check if scheduled time has passed and booking hasn't been marked as reached
            # Give a grace period of 15 minutes
            if now > scheduled_datetime + timedelta(minutes=15) and booking.status in ['ASSIGNED', 'CONFIRMED']:
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
                    notification = Notification.objects.create(
                        user=admin_user,
                        title='Booking Delayed - Worker Did Not Reach On Time',
                        message=f'Worker did not reach on time for booking #{booking.id} ({booking.service.name}). Service is delayed.',
                        notification_type='SYSTEM'
                    )

                delayed_count += 1

        logger.info(
            f"Checked for delayed bookings. {delayed_count} bookings marked as delayed.")
        return f"{delayed_count} bookings marked as delayed."

    except Exception as exc:
        logger.error(f"Failed to check for delayed bookings: {str(exc)}")
        return f"Failed to check for delayed bookings: {str(exc)}"
