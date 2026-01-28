from __future__ import absolute_import, unicode_literals
from celery.schedules import crontab
import os
from celery import Celery

# set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'home_service.settings')

app = Celery('home_service')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Configure periodic tasks

app.conf.beat_schedule = {
    'check-and-mark-delayed-bookings': {
        'task': 'core.tasks.check_and_mark_delayed_bookings',
        'schedule': crontab(minute='*/15'),  # Run every 15 minutes
    },
}
app.conf.timezone = 'UTC'
