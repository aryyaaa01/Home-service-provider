from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('users/', views.user_list, name='user_list'),
    path('workers/', views.worker_list, name='worker_list'),
    path('services/', views.service_list, name='service_list'),
    path('bookings/', views.booking_list, name='booking_list'),
    path('bookings/<int:pk>/', views.booking_detail, name='booking_detail'),
    path('bookings/<int:pk>/cancel/', views.cancel_booking, name='cancel_booking'),
    path('bookings/my/', views.user_bookings, name='user_bookings'),
    path('profile/', views.profile, name='profile'),
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('approve-worker/<int:user_id>/',
         views.approve_worker, name='approve_worker'),
    path('ratings/', views.rating_list, name='ratings'),
    path('service-details/<int:service_id>/',
         views.service_details, name='service_details'),
    path('services/<int:service_id>/ratings/',
         views.service_ratings, name='service_ratings'),

    # Worker-specific endpoints
    path('workers/bookings/', views.worker_bookings, name='worker_bookings'),
    path('workers/bookings/<int:booking_id>/decision/',
         views.worker_booking_decision, name='worker_booking_decision'),
    path('workers/bookings/<int:booking_id>/generate-otp/',
         views.worker_generate_otp, name='worker_generate_otp'),
    path('workers/verify-otp/', views.worker_verify_otp, name='worker_verify_otp'),
    path('workers/me/ratings/', views.worker_received_ratings,
         name='worker_received_ratings'),

    path('admin/workers/', views.admin_worker_list, name='admin_worker_list'),
    path('admin/users/', views.admin_user_list, name='admin_user_list'),
    path('admin/workers/<int:worker_id>/approval/',
         views.admin_worker_approval_action, name='admin_worker_approval_action'),
    path('admin/workers/<int:worker_id>/approve/',
         views.admin_approve_worker, name='admin_approve_worker'),
    path('admin/bookings/<int:booking_id>/assign-worker/',
         views.admin_assign_worker, name='admin_assign_worker'),
    path('admin/bookings/', views.admin_booking_list, name='admin_booking_list'),
    path('admin/ratings/', views.admin_ratings_list, name='admin_ratings_list'),

    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/<int:notification_id>/mark-read/',
         views.mark_notification_as_read, name='mark_notification_as_read'),

    # Payment endpoints
    path('bookings/<int:booking_id>/payment/',
         views.process_payment, name='process_payment'),
    path('bookings/<int:booking_id>/payment/details/',
         views.get_payment_details, name='get_payment_details'),

    # Delayed service suggestion endpoints
    path('bookings/<int:booking_id>/suggest-delayed/',
         views.suggest_delayed_service, name='suggest_delayed_service'),
    path('bookings/<int:booking_id>/respond-to-delayed/',
         views.user_respond_to_delayed_service, name='user_respond_to_delayed_service'),

    # Reached status endpoints
    path('bookings/<int:booking_id>/mark-reached/',
         views.mark_booking_reached, name='mark_booking_reached'),
]
