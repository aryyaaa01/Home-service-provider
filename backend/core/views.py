from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
from .models import UserProfile, Service, Booking, OTP, RatingReview, Notification, Payment
from .tasks import send_otp_email
import json


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user
    """
    data = request.data
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    phone_number = data.get('phone_number')
    address = data.get('address')
    specialty = data.get('specialty')
    role = data.get('role', 'USER')  # Default to USER if not specified

    if not username or not password or not email:
        return Response({'error': 'Username, password, and email are required'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Validate phone number: must be exactly 10 digits
    if not phone_number:
        return Response({'error': 'Phone number is required'},
                        status=status.HTTP_400_BAD_REQUEST)

    import re
    if not re.match(r'^\d{10}$', str(phone_number)):
        return Response({'error': 'Phone number must be exactly 10 digits'},
                        status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'},
                        status=status.HTTP_400_BAD_REQUEST)

    # Create the user
    user = User.objects.create_user(
        username=username,
        password=password,
        email=email
    )

    # Create the user profile
    user_profile = UserProfile.objects.create(
        user=user,
        phone_number=phone_number,
        address=address,
        specialty=specialty if specialty else None,
        role=role
    )

    # If the user is a worker and selected services, assign them
    if role == 'WORKER':
        service_data = data.get('service')
        if service_data:
            # Handle both single service ID and array of service IDs
            if isinstance(service_data, int):
                # Single service ID
                try:
                    service = Service.objects.get(id=service_data)
                    user_profile.services.add(service)
                except Service.DoesNotExist:
                    pass
            elif isinstance(service_data, list):
                # Array of service IDs
                for service_id in service_data:
                    try:
                        service = Service.objects.get(id=int(service_id))
                        user_profile.services.add(service)
                    except (ValueError, Service.DoesNotExist):
                        # Skip invalid service IDs
                        continue

    # Create auth token
    token, created = Token.objects.get_or_create(user=user)

    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login a user
    """
    data = request.data
    username = data.get('username')
    password = data.get('password')

    user = authenticate(username=username, password=password)

    if user is not None:
        # Check if user has a profile and if it's a worker who hasn't been approved
        try:
            profile = UserProfile.objects.get(user=user)
            # Check if user is a superuser first (takes precedence over profile role)
            if user.is_superuser or profile.role == 'ADMIN':
                role = 'ADMIN'
            else:
                role = profile.role

            # If user is a worker, check if they are approved
            if role == 'WORKER' and not profile.is_approved:
                return Response({
                    'error': 'Worker account not approved yet. Please contact admin for approval before logging in.'
                }, status=status.HTTP_401_UNAUTHORIZED)
        except UserProfile.DoesNotExist:
            # For users without a profile, check if they are a superuser
            if user.is_superuser:
                role = 'ADMIN'
            else:
                role = 'USER'

        login(request, user)
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role
            }
        })
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout a user
    """
    try:
        request.user.auth_token.delete()
    except:
        pass

    logout(request)
    return Response({'message': 'Successfully logged out'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    """
    Get list of all users
    """
    users = User.objects.all()
    user_data = []

    for user in users:
        try:
            profile = UserProfile.objects.get(user=user)
            # Only include users with role 'USER', exclude 'WORKER' and 'ADMIN'
            if profile.role == 'USER':
                user_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'phone_number': profile.phone_number,
                    'address': profile.address,
                    'role': profile.role
                })
        except UserProfile.DoesNotExist:
            # Include users without profiles (shouldn't happen in our system, but just in case)
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': 'USER'  # Default role
            })

    return Response(user_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worker_list(request):
    """
    Get list of all workers
    """
    # Only get profiles with role 'WORKER'
    workers = UserProfile.objects.filter(role='WORKER')
    worker_data = []

    for worker in workers:
        worker_data.append({
            'id': worker.user.id,
            'username': worker.user.username,
            'email': worker.user.email,
            'phone_number': worker.phone_number,
            'specialty': worker.specialty,
            'is_approved': worker.is_approved
        })

    return Response(worker_data)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([AllowAny])  # Allow public access to services
def service_list(request):
    """
    Get list of all services or create a new service
    """
    if request.method == 'GET':
        services = Service.objects.all()
        service_data = []

        for service in services:
            # Parse included_items if it exists
            included_items = []
            if service.included_items:
                try:
                    import json
                    included_items = json.loads(service.included_items)
                except:
                    included_items = []

            service_data.append({
                'id': service.id,
                'name': service.name,
                'description': service.description,
                'price': service.price,
                'estimated_duration': service.estimated_duration,
                'included_items': included_items,
                'average_rating': service.average_rating
            })

        return Response(service_data)

    elif request.method == 'POST':
        data = request.data

        # Handle included_items
        included_items = data.get('included_items', [])
        included_items_json = None
        if included_items and isinstance(included_items, list):
            try:
                import json
                included_items_json = json.dumps(included_items)
            except:
                included_items_json = None

        service = Service.objects.create(
            name=data['name'],
            description=data['description'],
            price=data['price'],
            estimated_duration=data['estimated_duration'],
            included_items=included_items_json
        )

        return Response({
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'price': service.price,
            'estimated_duration': service.estimated_duration,
            'included_items': included_items,
            'average_rating': service.average_rating
        }, status=status.HTTP_201_CREATED)

    elif request.method == 'DELETE':
        # Check if user is admin (only admins can delete services)
        if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
            return Response({'error': 'Only admins can delete services'}, status=status.HTTP_403_FORBIDDEN)

        service_id = request.data.get('service_id')
        if not service_id:
            return Response({'error': 'Service ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            service = Service.objects.get(id=service_id)
            service_name = service.name
            service.delete()
            return Response({'message': f'Service "{service_name}" deleted successfully'}, status=status.HTTP_200_OK)
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_bookings(request):
    """
    Get bookings for the authenticated user
    """
    try:
        bookings = Booking.objects.filter(user=request.user)
        booking_data = []

        for booking in bookings:
            # Get payment information if it exists
            payment_info = None
            try:
                payment = booking.payment  # Access the related payment
                payment_info = {
                    'id': payment.id,
                    'total_amount': str(payment.total_amount),
                    'admin_commission': str(payment.admin_commission),
                    'provider_amount': str(payment.provider_amount),
                    'payment_status': payment.payment_status,
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'created_at': payment.created_at
                }
            except Payment.DoesNotExist:
                pass  # No payment exists for this booking

            booking_data.append({
                'id': booking.id,
                'service_detail': {
                    'id': booking.service.id,
                    'name': booking.service.name,
                    'description': booking.service.description,
                    'price': booking.service.price
                },
                'service_name': booking.service.name,
                'worker_username': booking.worker.user.username if booking.worker else None,
                'status': booking.status,
                'scheduled_date': booking.date,
                'scheduled_time': booking.time_slot,
                'suggested_date': booking.suggested_date,
                'suggested_time': booking.suggested_time,
                'address': booking.address,
                'is_rated': booking.is_rated,
                'created_at': booking.created_at,
                'payment': payment_info
            })

        return Response(booking_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def booking_list(request):
    """
    Get list of all bookings or create a new booking
    """
    if request.method == 'GET':
        bookings = Booking.objects.all()
        booking_data = []

        for booking in bookings:
            booking_data.append({
                'id': booking.id,
                'user': booking.user.username,
                'worker': booking.worker.user.username if booking.worker else None,
                'service': booking.service.name,
                'date': booking.date,
                'time_slot': booking.time_slot,
                'status': booking.status,
                'address': booking.address,
                'created_at': booking.created_at,
                'updated_at': booking.updated_at
            })

        return Response(booking_data)

    elif request.method == 'POST':
        data = request.data

        try:
            service = Service.objects.get(id=data['service'])
        except Service.DoesNotExist:
            return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)
        except KeyError:
            return Response({'error': 'Service ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate required fields
        required_fields = ['date', 'time_slot', 'address']
        for field in required_fields:
            if field not in data:
                return Response({'error': f'{field} is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get address from request data or user profile
        address = data.get('address', '').strip()
        if not address:
            # Try to get address from user profile
            try:
                user_profile = UserProfile.objects.get(user=request.user)
                address = user_profile.address or ''
            except UserProfile.DoesNotExist:
                address = ''

        try:
            booking = Booking.objects.create(
                user=request.user,
                service=service,
                date=data['date'],
                time_slot=data['time_slot'],
                address=address,
                status='PENDING'
            )
        except Exception as e:
            return Response({'error': f'Failed to create booking: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'id': booking.id,
            'user': booking.user.username,
            'service': booking.service.name,
            'date': booking.date,
            'time_slot': booking.time_slot,
            'status': booking.status,
            'address': booking.address
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def booking_detail(request, pk):
    """
    Get, update or delete a booking
    """
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': booking.id,
            'user': booking.user.username,
            'worker': booking.worker.user.username if booking.worker else None,
            'service': booking.service.name,
            'service_price': booking.service.price,
            'date': booking.date,
            'time_slot': booking.time_slot,
            'status': booking.status,
            'address': booking.address
        })

    elif request.method == 'PUT':
        data = request.data
        booking.status = data.get('status', booking.status)
        booking.save()

        return Response({
            'id': booking.id,
            'user': booking.user.username,
            'worker': booking.worker.user.username if booking.worker else None,
            'service': booking.service.name,
            'service_price': booking.service.price,
            'date': booking.date,
            'time_slot': booking.time_slot,
            'status': booking.status,
            'address': booking.address
        })

    elif request.method == 'DELETE':
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def cancel_booking(request, pk):
    """
    Cancel a booking by changing its status to CANCELLED
    Send notification to the assigned worker
    """
    try:
        booking = Booking.objects.get(pk=pk)

        # Check if the authenticated user is the owner of the booking
        if booking.user != request.user:
            return Response({'error': 'You can only cancel your own bookings'},
                            status=status.HTTP_403_FORBIDDEN)

        # Only allow cancellation for PENDING or ASSIGNED status
        if booking.status not in ['PENDING', 'ASSIGNED']:
            return Response({'error': f'Cannot cancel booking with status {booking.status}'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Update booking status to CANCELLED
        booking.status = 'CANCELLED'
        booking.save()

        # If there's an assigned worker, send notification
        if booking.worker:
            create_notification(
                user=booking.worker.user,
                title='Booking Cancelled',
                message=f'Booking #{booking.id} for {booking.service.name} has been cancelled by {request.user.username}.',
                notification_type='BOOKING_STATUS'
            )

        # Send notification to all admin users
        from django.contrib.auth.models import User
        from django.db.models import Q

        # Get all admin users (both superusers and users with ADMIN role)
        admin_users = User.objects.filter(
            Q(is_superuser=True) |
            Q(userprofile__role='ADMIN')
        ).distinct()

        for admin_user in admin_users:
            create_notification(
                user=admin_user,
                title='Booking Cancelled by User',
                message=f'Booking #{booking.id} for {booking.service.name} has been cancelled by {request.user.username}.',
                notification_type='BOOKING_STATUS'
            )

        return Response({'message': 'Booking cancelled successfully', 'booking_id': booking.id})

    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    """
    Get or update user profile
    """
    if request.method == 'GET':
        try:
            profile = UserProfile.objects.get(user=request.user)
            return Response({
                'id': profile.id,
                'username': request.user.username,
                'email': request.user.email,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'role': profile.role,
                'specialty': profile.specialty,
                'is_approved': profile.is_approved
            })
        except UserProfile.DoesNotExist:
            # Create a default profile for users who don't have one
            profile = UserProfile.objects.create(
                user=request.user,
                phone_number='',
                address='',
                role='USER'
            )
            return Response({
                'id': profile.id,
                'username': request.user.username,
                'email': request.user.email,
                'phone_number': profile.phone_number,
                'address': profile.address,
                'role': profile.role,
                'specialty': profile.specialty,
                'is_approved': profile.is_approved
            })

    elif request.method == 'PUT':
        data = request.data

        # Validate phone number: must be exactly 10 digits

        # Validate and update email if provided
        email = data.get('email')
        if email and email != request.user.email:
            # Basic email validation
            import re
            if not re.match(r'^[^@]+@[^@]+\.[^@]+$', email):
                return Response({'error': 'Invalid email format'},
                                status=status.HTTP_400_BAD_REQUEST)
            request.user.email = email
            request.user.save()

        # Validate phone number: must be exactly 10 digits
        phone_number = data.get('phone_number')
        if phone_number:
            import re
            if not re.match(r'^\d{10}$', phone_number):
                return Response({'error': 'Phone number must be exactly 10 digits'},
                                status=status.HTTP_400_BAD_REQUEST)

        try:
            profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            # Create a default profile for users who don't have one
            profile = UserProfile.objects.create(
                user=request.user,
                phone_number='',
                address='',
                role='USER'
            )

        profile.phone_number = data.get('phone_number', profile.phone_number)
        profile.address = data.get('address', profile.address)
        profile.specialty = data.get('specialty', profile.specialty)
        profile.save()

        return Response({
            'id': profile.id,
            'username': request.user.username,
            'email': request.user.email,
            'phone_number': profile.phone_number,
            'address': profile.address,
            'role': profile.role,
            'specialty': profile.specialty,
            'is_approved': profile.is_approved
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_otp(request):
    """
    Send OTP to user
    """
    data = request.data
    phone_number = data.get('phone_number')

    # In a real app, this would send an actual OTP
    # For now, we'll just create a dummy OTP
    otp_instance, created = OTP.objects.get_or_create(
        user=request.user,
        defaults={'code': '123456'}  # In real app, generate random code
    )

    # In a real app, you would send the OTP via SMS or email
    # For now, we'll just return a success message
    return Response({
        'message': 'OTP sent successfully',
        'otp_id': otp_instance.id
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_otp(request):
    """
    Verify OTP
    """
    data = request.data
    otp_code = data.get('otp_code')

    try:
        otp_instance = OTP.objects.get(user=request.user, code=otp_code)
        otp_instance.delete()  # OTP verified, so delete it

        return Response({
            'message': 'OTP verified successfully'
        })
    except OTP.DoesNotExist:
        return Response({
            'error': 'Invalid OTP'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_worker(request, user_id):
    """
    Approve a worker (admin only)
    """
    # Check if user is admin
    profile = UserProfile.objects.get(user=request.user)
    if profile.role != 'ADMIN':
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        worker_profile = UserProfile.objects.get(
            user_id=user_id, role='WORKER')
        worker_profile.is_approved = True
        worker_profile.save()

        return Response({
            'message': 'Worker approved successfully',
            'worker_id': worker_profile.id
        })
    except UserProfile.DoesNotExist:
        return Response({
            'error': 'Worker not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def rating_list(request):
    """
    Get list of all ratings/reviews or create a new rating
    """
    if request.method == 'POST':
        # Create a new rating
        user = request.user
        rating_value = request.data.get('rating')
        review_text = request.data.get('review', '')
        service_id = request.data.get('service')
        booking_id = request.data.get('booking')

        # Validation
        if not rating_value or rating_value < 1 or rating_value > 5:
            return Response({'error': 'Rating must be between 1 and 5'}, status=status.HTTP_400_BAD_REQUEST)

        # If booking_id is provided, get the booking to link to worker
        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)
            except Booking.DoesNotExist:
                return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

        # If service_id is provided, get the service
        service = None
        if service_id:
            try:
                service = Service.objects.get(id=service_id)
            except Service.DoesNotExist:
                return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)

        # Get worker from booking if available
        worker = booking.worker if booking else None

        # Create the rating
        rating = RatingReview.objects.create(
            user=user,
            rating=rating_value,
            review=review_text,
            service=service,
            booking=booking,
            worker=worker
        )

        # If booking exists, mark it as rated
        if booking:
            booking.is_rated = True
            booking.save()

        # Return the created rating
        rating_data = {
            'id': rating.id,
            'user': rating.user.username,
            'user_username': rating.user.username,
            'worker': rating.worker.user.username if rating.worker else None,
            'worker_username': rating.worker.user.username if rating.worker else None,
            'service': rating.service.name if rating.service else None,
            'service_name': rating.service.name if rating.service else None,
            'rating': rating.rating,
            'review': rating.review,
            'created_at': rating.created_at
        }

        return Response(rating_data, status=status.HTTP_201_CREATED)

    # GET request - return all ratings
    ratings = RatingReview.objects.all()
    rating_data = []

    for rating in ratings:
        # Get service name, with fallback to service from booking if rating doesn't have direct service
        service_name = rating.service.name if rating.service else None
        if not service_name and rating.booking and rating.booking.service:
            service_name = rating.booking.service.name

        rating_data.append({
            'id': rating.id,
            'user': rating.user.username,
            'user_username': rating.user.username,
            'worker': rating.worker.user.username if rating.worker else None,
            'worker_username': rating.worker.user.username if rating.worker else None,
            'service': service_name,
            'service_name': service_name,
            'rating': rating.rating,
            'review': rating.review,
            'created_at': rating.created_at
        })

    return Response(rating_data)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_details(request, service_id):
    """
    Get detailed information about a specific service (public access)
    """
    try:
        service = Service.objects.get(id=service_id)
        return Response({
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'price': service.price,
            'estimated_duration': service.estimated_duration,
            'category': service.category,
            'average_rating': service.average_rating
        })
    except Service.DoesNotExist:
        return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def service_ratings(request, service_id):
    """
    Get ratings for a specific service (public access)
    """
    try:
        service = Service.objects.get(id=service_id)
        # Get ratings directly linked to this service
        direct_ratings = RatingReview.objects.filter(service=service)
        # Also get ratings linked through bookings that have this service
        booking_ratings = RatingReview.objects.filter(booking__service=service)
        # Combine both querysets and remove duplicates
        ratings = (direct_ratings | booking_ratings).distinct()

        rating_data = []
        for rating in ratings:
            # Get service name, with fallback to service from booking if rating doesn't have direct service
            service_name = rating.service.name if rating.service else None
            if not service_name and rating.booking and rating.booking.service:
                service_name = rating.booking.service.name

            rating_data.append({
                'id': rating.id,
                'user': rating.user.username,
                'user_username': rating.user.username,
                'rating': rating.rating,
                'review': rating.review,
                'created_at': rating.created_at,
                'worker': rating.worker.user.username if rating.worker else None,
                'service': service_name,
                'service_name': service_name,
            })

        return Response(rating_data)
    except Service.DoesNotExist:
        return Response({'error': 'Service not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worker_bookings(request):
    """
    Get bookings assigned to the authenticated worker
    """
    try:
        worker_profile = UserProfile.objects.get(
            user=request.user, role='WORKER')
        bookings = Booking.objects.filter(worker=worker_profile)

        booking_data = []
        for booking in bookings:
            # Get payment information if it exists
            payment_info = None
            try:
                payment = booking.payment  # Access the related payment
                payment_info = {
                    'id': payment.id,
                    'total_amount': str(payment.total_amount),
                    'admin_commission': str(payment.admin_commission),
                    'provider_amount': str(payment.provider_amount),
                    'payment_status': payment.payment_status,
                    'payment_method': payment.payment_method,
                    'transaction_id': payment.transaction_id,
                    'created_at': payment.created_at
                }
            except Payment.DoesNotExist:
                pass  # No payment exists for this booking

            booking_data.append({
                'id': booking.id,
                'user': {
                    'id': booking.user.id,
                    'username': booking.user.username,
                    'email': booking.user.email
                },
                'service_detail': {
                    'id': booking.service.id,
                    'name': booking.service.name,
                    'description': booking.service.description,
                    'price': booking.service.price
                },
                'service_name': booking.service.name,
                'user_username': booking.user.username,
                'date': booking.date,
                'time_slot': booking.time_slot,
                'suggested_date': booking.suggested_date,
                'suggested_time': booking.suggested_time,
                'status': booking.status,
                'address': booking.address,
                'is_rated': booking.is_rated,
                'created_at': booking.created_at,
                'payment': payment_info
            })

        return Response(booking_data)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Only workers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def worker_booking_decision(request, booking_id):
    """
    Accept or reject a booking (worker only)
    """
    try:
        worker_profile = UserProfile.objects.get(
            user=request.user, role='WORKER')
        booking = Booking.objects.get(id=booking_id, worker=worker_profile)

        decision = request.data.get('decision')  # 'accept' or 'reject'

        if decision == 'accept':
            booking.status = 'CONFIRMED'
            booking.save()
            return Response({'message': 'Booking accepted'})
        elif decision == 'reject':
            booking.status = 'PENDING'  # Return to pending for admin to reassign
            booking.worker = None  # Unassign the worker
            booking.save()

            # Create a notification for admins about the rejection
            from django.contrib.auth.models import User
            from .models import Notification
            from django.db.models import Q

            # Get all admin users (both superusers and users with ADMIN role)
            admin_users = User.objects.filter(
                Q(is_superuser=True) |
                Q(userprofile__role='ADMIN')
            ).distinct()

            for admin_user in admin_users:
                create_notification(
                    user=admin_user,
                    title='Booking Rejected by Worker',
                    message=f'Booking #{booking.id} for {booking.service.name} was rejected by {worker_profile.user.username}. Please reassign to another worker.',
                    notification_type='BOOKING_REJECTION'
                )

            return Response({'message': 'Booking rejected and returned to pending for reassignment'})
        else:
            return Response({'error': 'Invalid decision. Use "accept" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)

    except UserProfile.DoesNotExist:
        return Response({'error': 'Only workers can make this decision'}, status=status.HTTP_403_FORBIDDEN)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def worker_generate_otp(request, booking_id):
    """
    Generate OTP for a completed booking (worker only)
    """
    try:
        worker_profile = UserProfile.objects.get(
            user=request.user, role='WORKER')
        booking = Booking.objects.get(id=booking_id, worker=worker_profile)

        # Generate a random 6-digit OTP
        import random
        otp_code = str(random.randint(100000, 999999))

        # Update booking status to IN_PROGRESS when OTP is generated
        booking.status = 'IN_PROGRESS'
        booking.save()

        # Create or update OTP record
        otp, created = OTP.objects.update_or_create(
            user=booking.user,
            booking=booking,
            defaults={'code': otp_code, 'is_verified': False}
        )

        # Create a notification for the user
        create_notification(
            user=booking.user,
            title='OTP Generated for Your Service',
            message=f'Your service has been completed by {worker_profile.user.username}. An OTP has been sent to your email. Please share this OTP with the worker to complete the job.',
            notification_type='OTP'
        )

        # Send OTP email asynchronously using Celery
        send_otp_email.delay(
            booking.id,
            otp_code,
            worker_profile.user.username,
            booking.user.email,
            booking.user.username
        )

        return Response({'message': 'OTP generated and sent to customer', 'otp_id': otp.id})

    except UserProfile.DoesNotExist:
        return Response({'error': 'Only workers can generate OTP'}, status=status.HTTP_403_FORBIDDEN)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def worker_verify_otp(request):
    """
    Verify OTP provided by customer (worker only)
    """


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def worker_received_ratings(request):
    """
    Get ratings received by the authenticated worker
    """
    try:
        worker_profile = UserProfile.objects.get(
            user=request.user, role='WORKER')

        # Get all ratings where this worker was the service provider
        ratings = RatingReview.objects.filter(worker=worker_profile)

        rating_data = []
        for rating in ratings:
            # Get service name, with fallback to service from booking if rating doesn't have direct service
            service_name = rating.service.name if rating.service else None
            if not service_name and rating.booking and rating.booking.service:
                service_name = rating.booking.service.name

            rating_data.append({
                'id': rating.id,
                'user': rating.user.username,
                'user_username': rating.user.username,
                'worker': rating.worker.user.username if rating.worker else None,
                'worker_username': rating.worker.user.username if rating.worker else None,
                'service': service_name,
                'service_name': service_name,
                'booking': rating.booking.id if rating.booking else None,
                'rating': rating.rating,
                'review': rating.review,
                'created_at': rating.created_at
            })

        return Response(rating_data)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Only workers can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def worker_verify_otp(request):
    """
    Verify OTP provided by customer (worker only)
    """
    print(
        f"DEBUG: Received OTP verification request from user: {request.user.username}")
    print(f"DEBUG: Request data: {request.data}")
    try:
        worker_profile = UserProfile.objects.get(
            user=request.user, role='WORKER')
        print(f"DEBUG: Worker profile found: {worker_profile.user.username}")
        otp_code = request.data.get('otp_code')
        booking_id = request.data.get('booking_id')
        print(f"DEBUG: OTP Code: {otp_code}, Booking ID: {booking_id}")

        try:
            booking = Booking.objects.get(id=booking_id, worker=worker_profile)
            otp = OTP.objects.get(
                user=booking.user, booking=booking, code=otp_code, is_verified=False)

            # Mark OTP as verified
            otp.is_verified = True
            otp.save()

            # Update booking status to IN_PROGRESS (waiting for payment)
            booking.status = 'IN_PROGRESS'
            booking.save()

            return Response({'message': 'OTP verified successfully. Booking marked as completed.'})

        except OTP.DoesNotExist:
            print(
                f"DEBUG: OTP DoesNotExist - Code: {otp_code}, Booking: {booking_id}")
            return Response({'error': 'Invalid or already verified OTP'}, status=status.HTTP_400_BAD_REQUEST)
        except Booking.DoesNotExist:
            print(f"DEBUG: Booking DoesNotExist - ID: {booking_id}")
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    except UserProfile.DoesNotExist:
        return Response({'error': 'Only workers can verify OTP'}, status=status.HTTP_403_FORBIDDEN)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_worker_list(request):
    """
    Get list of all workers (admin only)
    """
    # Check if user is admin (either superuser or has ADMIN role in profile)
    if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
        return Response({'error': 'Only admins can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    # Only get profiles with role 'WORKER'
    workers = UserProfile.objects.filter(role='WORKER')

    worker_data = []
    for worker in workers:
        # Get the services associated with this worker
        worker_services = []
        for service in worker.services.all():
            worker_services.append({
                'id': service.id,
                'name': service.name
            })

        worker_data.append({
            'id': worker.id,
            'user_id': worker.user.id,
            'username': worker.user.username,
            'email': worker.user.email,
            'phone_number': worker.phone_number,
            'specialty': worker.specialty,
            'services': worker_services,  # Include services associated with the worker
            'is_approved': worker.is_approved,
            'created_at': worker.created_at
        })

    return Response(worker_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_user_list(request):
    """
    Get list of all users (admin only)
    """
    # Check if user is admin (either superuser or has ADMIN role in profile)
    if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
        return Response({'error': 'Only admins can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    # Exclude superusers and workers from the user list to only show regular users
    users = User.objects.filter(is_superuser=False)

    user_data = []
    for user in users:
        try:
            profile = UserProfile.objects.get(user=user)
            # Only include users with role 'USER', exclude 'WORKER' and 'ADMIN'
            if profile.role == 'USER':
                user_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': profile.role,
                    'phone_number': profile.phone_number,
                    'address': profile.address,
                    'is_approved': profile.is_approved
                })
        except UserProfile.DoesNotExist:
            # Include users without profiles (shouldn't happen in our system, but just in case)
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': 'USER'
            })

    return Response(user_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_worker(request, worker_id):
    """
    Approve a worker (admin only)
    """
    try:
        admin_profile = UserProfile.objects.get(
            user=request.user, role='ADMIN')
        worker_profile = UserProfile.objects.get(id=worker_id, role='WORKER')

        worker_profile.is_approved = True
        worker_profile.save()

        return Response({'message': 'Worker approved successfully', 'worker_id': worker_profile.id})
    except UserProfile.DoesNotExist:
        return Response({'error': 'Only admins can approve workers'}, status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response({'error': 'Worker not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_worker_approval_action(request, worker_id):
    """
    Approve or reject a worker (admin only) - matches frontend expectation
    """
    # Check if user is admin (either superuser or has ADMIN role in profile)
    if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
        return Response({'error': 'Only admins can perform this action'}, status=status.HTTP_403_FORBIDDEN)

    try:
        # Check if the worker exists
        worker_profile = UserProfile.objects.get(id=worker_id, role='WORKER')

        # Process the action
        action = request.data.get('action')

        if action == 'approve':
            worker_profile.is_approved = True
            worker_profile.save()
            return Response({'detail': 'Worker approved successfully'})
        elif action == 'reject':
            worker_profile.is_approved = False
            worker_profile.save()
            return Response({'detail': 'Worker rejected'})
        else:
            return Response({'error': 'Invalid action. Use "approve" or "reject"'}, status=status.HTTP_400_BAD_REQUEST)

    except UserProfile.DoesNotExist:
        return Response({'error': 'Worker not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Error updating worker approval: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_assign_worker(request, booking_id):
    """
    Assign a worker to a booking (admin only)
    """
    try:
        # Check if user is admin (either superuser or has ADMIN role in profile)
        if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and hasattr(request.user.userprofile, 'role') and request.user.userprofile.role == 'ADMIN')):
            return Response({'error': 'Only admins can assign workers'}, status=status.HTTP_403_FORBIDDEN)

        booking = Booking.objects.get(id=booking_id)
        worker_id = request.data.get('worker_id')

        worker_profile = UserProfile.objects.get(
            id=worker_id, role='WORKER',
            is_approved=True)

        # Check if the worker is qualified to provide this service
        if booking.service not in worker_profile.services.all():
            return Response({'error': f'Worker {worker_profile.user.username} is not qualified to provide {booking.service.name} service'},
                            status=status.HTTP_400_BAD_REQUEST)

        booking.worker = worker_profile
        booking.status = 'ASSIGNED'
        booking.save()

        # Create notification for the assigned worker
        create_notification(
            user=worker_profile.user,
            title='New Booking Assigned',
            message=f'You have been assigned a new booking #{booking.id} for {booking.service.name} on {booking.date} at {booking.time_slot}.',
            notification_type='ASSIGNMENT'
        )

        return Response({'message': 'Worker assigned successfully', 'booking_id': booking.id})
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except UserProfile.DoesNotExist:
        return Response({'error': 'Worker not found or not approved'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_ratings_list(request):
    """
    Get all ratings (admin only)
    """
    # Check if user is admin (either superuser or has ADMIN role in profile)
    if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
        return Response({'error': 'Only admins can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    ratings = RatingReview.objects.all().order_by('-created_at')

    rating_data = []
    for rating in ratings:
        # Get service name, with fallback to service from booking if rating doesn't have direct service
        service_name = rating.service.name if rating.service else None
        if not service_name and rating.booking and rating.booking.service:
            service_name = rating.booking.service.name

        rating_data.append({
            'id': rating.id,
            'booking': rating.booking.id if rating.booking else None,
            'user': rating.user.username,
            'user_username': rating.user.username,
            'worker': rating.worker.user.username if rating.worker else None,
            'worker_username': rating.worker.user.username if rating.worker else None,
            'service': service_name,
            'service_name': service_name,
            'rating': rating.rating,
            'review': rating.review,
            'created_at': rating.created_at
        })

    return Response(rating_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_booking_list(request):
    """
    Get all bookings (admin only)
    """
    # Check if user is admin (either superuser or has ADMIN role in profile)
    if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
        return Response({'error': 'Only admins can access this endpoint'}, status=status.HTTP_403_FORBIDDEN)

    bookings = Booking.objects.all()

    booking_data = []
    for booking in bookings:
        # Get payment information if it exists
        payment_info = None
        try:
            payment = booking.payment  # Access the related payment
            payment_info = {
                'id': payment.id,
                'total_amount': str(payment.total_amount),
                'admin_commission': str(payment.admin_commission),
                'provider_amount': str(payment.provider_amount),
                'payment_status': payment.payment_status,
                'payment_method': payment.payment_method,
                'transaction_id': payment.transaction_id,
                'created_at': payment.created_at
            }
        except Payment.DoesNotExist:
            pass  # No payment exists for this booking

        booking_data.append({
            'id': booking.id,
            'user_username': booking.user.username if booking.user else 'N/A',
            'service_name': booking.service.name if booking.service else 'N/A',
            'service_price': booking.service.price if booking.service else 'N/A',
            'worker_username': booking.worker.user.username if booking.worker and booking.worker.user else 'Not assigned',
            'date': booking.date,
            'scheduled_date': booking.date,  # For compatibility with frontend
            'scheduled_time': booking.time_slot,  # For compatibility with frontend
            'suggested_date': booking.suggested_date,
            'suggested_time': booking.suggested_time,
            'time_slot': booking.time_slot,
            'status': booking.status,
            'address': booking.address,
            'is_rated': booking.is_rated,
            'created_at': booking.created_at,
            'updated_at': booking.updated_at,
            'payment': payment_info
        })

    return Response(booking_data)


def create_notification(user, title, message, notification_type):
    """
    Helper function to create a notification
    """
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )
    return notification


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """
    Get all notifications for the authenticated user
    """
    try:
        notifications = Notification.objects.filter(
            user=request.user).order_by('-created_at')
        notification_data = []
        for notification in notifications:
            notification_data.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'notification_type': notification.notification_type,
                'is_read': notification.is_read,
                'created_at': notification.created_at
            })
        return Response(notification_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_as_read(request, notification_id):
    """
    Mark a specific notification as read
    """
    try:
        notification = Notification.objects.get(
            id=notification_id, user=request.user)
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_notifications_for_existing_bookings(request):
    """
    Create notifications for existing bookings based on their status
    """
    try:
        # Check if user is admin
        if not (request.user.is_superuser or (hasattr(request.user, 'userprofile') and request.user.userprofile.role == 'ADMIN')):
            return Response({'error': 'Only admins can trigger this action'}, status=status.HTTP_403_FORBIDDEN)

        bookings = Booking.objects.all()
        created_count = 0

        for booking in bookings:
            # Check if notification already exists for this booking
            existing_notification = Notification.objects.filter(
                user=booking.user,
                message__icontains=str(booking.id),
                notification_type='BOOKING_STATUS'
            ).first()

            if not existing_notification:
                if booking.status == 'ASSIGNED':
                    title = f'Booking #{booking.id} Assigned'
                    message = f'Your booking for {booking.service.name} has been assigned to a worker.'
                    create_notification(booking.user, title,
                                        message, 'ASSIGNMENT')

                    if booking.worker:
                        worker_title = f'New Booking Assigned: #{booking.id}'
                        worker_message = f'You have been assigned a new booking for {booking.service.name} on {booking.date}.'
                        create_notification(
                            booking.worker.user, worker_title, worker_message, 'ASSIGNMENT')

                elif booking.status == 'COMPLETED':
                    title = f'Booking #{booking.id} Completed'
                    message = f'Your booking for {booking.service.name} has been completed.'
                    create_notification(booking.user, title,
                                        message, 'BOOKING_STATUS')

                    if booking.worker:
                        worker_title = f'Booking #{booking.id} Completed'
                        worker_message = f'Booking for {booking.service.name} has been completed and verified.'
                        create_notification(
                            booking.worker.user, worker_title, worker_message, 'BOOKING_STATUS')

                created_count += 1

        return Response({'message': f'Successfully created notifications for {created_count} bookings'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request, booking_id):
    """
    Process payment for a booking
    Calculates admin commission (20%) and provider amount (80%)
    Updates booking status to CONFIRMED on successful payment
    """
    try:
        # Get the booking
        booking = Booking.objects.get(id=booking_id, user=request.user)

        # Check if booking is already paid
        if hasattr(booking, 'payment') and booking.payment.payment_status == 'SUCCESS':
            return Response({'error': 'Payment already processed for this booking'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Check if booking status allows payment
        # Payment can be made for pending, assigned, confirmed, in_progress, or completed bookings
        if booking.status not in ['PENDING', 'ASSIGNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']:
            return Response({'error': 'Cannot process payment for this booking status'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Get payment details from request
        payment_method = request.data.get('payment_method', 'CARD')
        transaction_id = request.data.get('transaction_id')

        # Validate payment method
        valid_methods = ['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'COD']
        if payment_method not in valid_methods:
            return Response({'error': 'Invalid payment method'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Calculate amounts
        service_price = booking.service.price
        total_amount = service_price
        admin_commission = total_amount * Decimal('0.20')  # 20%
        provider_amount = total_amount * Decimal('0.80')    # 80%

        # For dummy payment, we'll simulate success
        # In real implementation, this would integrate with payment gateway
        payment_status = 'SUCCESS'

        # Generate transaction ID if not provided
        if not transaction_id:
            import uuid
            transaction_id = f'txn_{uuid.uuid4().hex[:12]}'

        # Create or update payment record
        payment_data = {
            'total_amount': total_amount,
            'admin_commission': admin_commission,
            'provider_amount': provider_amount,
            'payment_status': payment_status,
            'payment_method': payment_method,
            'transaction_id': transaction_id
        }

        payment, created = Payment.objects.update_or_create(
            booking=booking,
            defaults=payment_data
        )

        # Update booking status to COMPLETED after successful payment
        booking.status = 'COMPLETED'
        booking.save()

        # Create notification for user
        create_notification(
            user=booking.user,
            title='Payment Successful',
            message=f'Payment of ₹{total_amount} processed successfully for booking #{booking.id}.',
            notification_type='PAYMENT'
        )

        # Create notification for worker if assigned
        if booking.worker:
            create_notification(
                user=booking.worker.user,
                title=f'Payment Received for Booking #{booking.id}',
                message=f'Payment of ₹{provider_amount} has been processed for your service.',
                notification_type='PAYMENT'
            )

        # Create notification for admin users
        from django.contrib.auth.models import User
        from django.db.models import Q

        # Get all admin users (both superusers and users with ADMIN role)
        admin_users = User.objects.filter(
            Q(is_superuser=True) |
            Q(userprofile__role='ADMIN')
        ).distinct()

        for admin_user in admin_users:
            create_notification(
                user=admin_user,
                title=f'Payment Received for Booking #{booking.id}',
                message=f'Payment of ₹{total_amount} has been processed for booking #{booking.id} for {booking.service.name}. Admin commission: ₹{admin_commission}, Provider amount: ₹{provider_amount}.',
                notification_type='PAYMENT'
            )

        # Return success response
        return Response({
            'message': 'Payment processed successfully',
            'booking_id': booking.id,
            'total_amount': str(total_amount),
            'admin_commission': str(admin_commission),
            'provider_amount': str(provider_amount),
            'payment_status': payment_status,
            'transaction_id': transaction_id,
            'booking_status': booking.status
        })

    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_details(request, booking_id):
    """
    Get payment details for a specific booking
    """
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)
        if not hasattr(booking, 'payment'):
            return Response({'error': 'No payment found for this booking'},
                            status=status.HTTP_404_NOT_FOUND)
        payment = booking.payment
        return Response({
            'booking_id': booking.id,
            'total_amount': str(payment.total_amount),
            'admin_commission': str(payment.admin_commission),
            'provider_amount': str(payment.provider_amount),
            'payment_status': payment.payment_status,
            'payment_method': payment.payment_method,
            'transaction_id': payment.transaction_id,
            'created_at': payment.created_at
        })

    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def suggest_delayed_service(request, booking_id):
    """
    Admin suggests a new date and time for a delayed service
    """
    try:
        # Check if user is admin
        user_profile = UserProfile.objects.get(user=request.user)
        if user_profile.role != 'ADMIN' and not request.user.is_superuser:
            return Response({'error': 'Only admins can suggest delayed services'},
                            status=status.HTTP_403_FORBIDDEN)

        booking = Booking.objects.get(id=booking_id)

        # Validate required fields
        suggested_date = request.data.get('suggested_date')
        suggested_time = request.data.get('suggested_time')

        if not suggested_date or not suggested_time:
            return Response({'error': 'Both suggested_date and suggested_time are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Save the suggested date and time (original date/time remain unchanged)
        booking.suggested_date = suggested_date
        booking.suggested_time = suggested_time
        booking.save()

        # Send notification to user
        create_notification(
            user=booking.user,
            title='Service Delayed - New Time Suggested',
            message=f'Your {booking.service.name} service has been delayed. New suggested date: {suggested_date}, time: {suggested_time}. Please review and respond.',
            notification_type='BOOKING_STATUS'
        )

        # Send notification to admin
        create_notification(
            user=request.user,
            title='Suggested Time Sent to User',
            message=f'Suggested time for booking #{booking.id} ({booking.service.name}) sent to {booking.user.username}. Waiting for user response.',
            notification_type='SYSTEM'
        )

        return Response({
            'message': 'Suggested time sent to user. Waiting for user response.',
            'booking_id': booking.id,
            'suggested_date': suggested_date,
            'suggested_time': suggested_time
        }, status=status.HTTP_200_OK)

    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_booking_reached(request, booking_id):
    """
    Mark a booking as reached (worker has arrived on time)
    """
    try:
        worker_profile = UserProfile.objects.get(
            user=request.user, role='WORKER')
        booking = Booking.objects.get(id=booking_id, worker=worker_profile)

        # Only allow marking as reached if status is ASSIGNED and before scheduled time
        if booking.status != 'ASSIGNED':
            return Response({'error': 'Cannot mark as reached. Booking is not in ASSIGNED status.'},
                            status=status.HTTP_400_BAD_REQUEST)

        # Update booking status to REACHED and set reached_at timestamp
        booking.status = 'REACHED'
        from django.utils import timezone
        booking.reached_at = timezone.now()
        booking.save()

        # Send notification to admin
        from django.contrib.auth.models import User
        from django.db.models import Q

        # Get all admin users (both superusers and users with ADMIN role)
        admin_users = User.objects.filter(
            Q(is_superuser=True) |
            Q(userprofile__role='ADMIN')
        ).distinct()

        for admin_user in admin_users:
            create_notification(
                user=admin_user,
                title='Worker Has Reached',
                message=f'Worker {worker_profile.user.username} has reached the service location on time for booking #{booking.id} ({booking.service.name}).',
                notification_type='SYSTEM'
            )

        return Response({
            'message': 'Booking marked as reached successfully',
            'booking_id': booking.id,
            'status': booking.status
        })

    except UserProfile.DoesNotExist:
        return Response({'error': 'Only workers can mark bookings as reached'}, status=status.HTTP_403_FORBIDDEN)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_respond_to_delayed_service(request, booking_id):
    """
    User responds to a delayed service suggestion (accept or cancel)
    """
    try:
        booking = Booking.objects.get(id=booking_id, user=request.user)

        # Check if there's a suggested date/time
        if not booking.suggested_date or not booking.suggested_time:
            return Response({'error': 'No delayed service suggestion found for this booking'},
                            status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action')  # 'accept' or 'cancel'

        if action == 'accept':
            # Copy suggested date/time to actual date/time
            booking.date = booking.suggested_date
            booking.time_slot = booking.suggested_time
            # Clear suggested fields
            booking.suggested_date = None
            booking.suggested_time = None
            # Update status back to Assigned
            booking.status = 'ASSIGNED'
            booking.save()

            # Notify admin and worker
            admin_users = User.objects.filter(
                Q(is_superuser=True) | Q(userprofile__role='ADMIN')
            ).distinct()

            for admin_user in admin_users:
                create_notification(
                    user=admin_user,
                    title='User Accepted New Service Time',
                    message=f'User {request.user.username} accepted the new date/time for booking #{booking.id} ({booking.service.name}). Updated to {booking.date} at {booking.time_slot}.',
                    notification_type='BOOKING_STATUS'
                )

            # Notify worker if assigned
            if booking.worker:
                create_notification(
                    user=booking.worker.user,
                    title='Service Time Updated',
                    message=f'The service time for booking #{booking.id} ({booking.service.name}) has been updated to {booking.date} at {booking.time_slot}.',
                    notification_type='BOOKING_STATUS'
                )

            return Response({
                'message': 'New date and time accepted successfully',
                'booking_id': booking.id,
                'new_date': booking.date,
                'new_time': booking.time_slot
            }, status=status.HTTP_200_OK)

        elif action == 'cancel':
            # Update booking status to Cancelled
            booking.status = 'CANCELLED'
            # Clear suggested fields
            booking.suggested_date = None
            booking.suggested_time = None
            booking.save()

            # Notify admin and worker
            admin_users = User.objects.filter(
                Q(is_superuser=True) | Q(userprofile__role='ADMIN')
            ).distinct()

            for admin_user in admin_users:
                create_notification(
                    user=admin_user,
                    title='User Cancelled Delayed Service',
                    message=f'User {request.user.username} cancelled the delayed service for booking #{booking.id} ({booking.service.name}).',
                    notification_type='BOOKING_STATUS'
                )

            # Notify worker if assigned
            if booking.worker:
                create_notification(
                    user=booking.worker.user,
                    title='Service Cancelled',
                    message=f'The service for booking #{booking.id} ({booking.service.name}) has been cancelled by the user.',
                    notification_type='BOOKING_STATUS'
                )

            return Response({
                'message': 'Service cancelled successfully',
                'booking_id': booking.id
            }, status=status.HTTP_200_OK)

        else:
            return Response({'error': 'Invalid action. Must be either "accept" or "cancel"'},
                            status=status.HTTP_400_BAD_REQUEST)

    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
