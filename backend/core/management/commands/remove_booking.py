from django.core.management.base import BaseCommand
from core.models import Booking, User, UserProfile, Service


class Command(BaseCommand):
    help = 'Remove a specific booking for Electrician service assigned to Manoj'

    def handle(self, *args, **options):
        self.stdout.write('Looking for the booking to remove...')

        # Find bookings that match the criteria
        bookings = Booking.objects.filter(
            service__name__icontains='Electrician',
            address__icontains='ftyguhkgjvhbm'
        ).filter(
            worker__user__username__icontains='Manoj'
        ).filter(
            status='IN_PROGRESS'
        )

        if bookings.exists():
            for booking in bookings:
                self.stdout.write(
                    self.style.WARNING(
                        f'Found booking: ID={booking.id}, '
                        f'User={booking.user.username}, '
                        f'Service={booking.service.name}, '
                        f'Worker={booking.worker.user.username if booking.worker else "None"}, '
                        f'Status={booking.status}, '
                        f'Date={booking.date}, '
                        f'Time={booking.time_slot}, '
                        f'Address={booking.address}'
                    )
                )

                # Confirm deletion
                confirm = input(
                    f"Do you want to delete booking ID {booking.id}? (y/N): ")
                if confirm.lower() == 'y':
                    booking_id = booking.id
                    booking.delete()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Successfully deleted booking ID {booking_id}')
                    )
                else:
                    self.stdout.write('Skipping this booking.')
        else:
            # Try a broader search
            self.stdout.write(
                'No bookings found with exact criteria. Trying broader search...')

            # Search for bookings with the specific address
            bookings = Booking.objects.filter(
                address__icontains='ftyguhkgjvhbm')

            for booking in bookings:
                self.stdout.write(
                    self.style.WARNING(
                        f'Found booking: ID={booking.id}, '
                        f'User={booking.user.username}, '
                        f'Service={booking.service.name}, '
                        f'Worker={booking.worker.user.username if booking.worker else "None"}, '
                        f'Status={booking.status}, '
                        f'Date={booking.date}, '
                        f'Time={booking.time_slot}, '
                        f'Address={booking.address}'
                    )
                )

                if 'electrician' in booking.service.name.lower():
                    confirm = input(
                        f"This looks like the electrician booking. Delete ID {booking.id}? (y/N): ")
                    if confirm.lower() == 'y':
                        booking_id = booking.id
                        booking.delete()
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Successfully deleted booking ID {booking_id}')
                        )
                    else:
                        self.stdout.write('Skipping this booking.')

            if not bookings.exists():
                self.stdout.write(
                    'No bookings found with the address "ftyguhkgjvhbm"')
