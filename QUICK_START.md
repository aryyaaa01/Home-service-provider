# 🚀 Quick Start Guide

## Step 1: Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# For macOS/Linux:
source venv/bin/activate
# For Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser
# Enter username: admin
# Enter email: admin@example.com
# Enter password: admin123

# Update admin role
python manage.py shell
```

In the Python shell, run:
```python
from core.models import User
admin = User.objects.get(username='admin')
admin.role = 'ADMIN'
admin.save()
exit()
```

```bash
# Start backend server
python manage.py runserver
```

Backend running at: http://localhost:8000/

## Step 2: Add Services (Browser)

1. Go to http://localhost:8000/admin/
2. Login with admin credentials
3. Click on "Services" → "Add Service"
4. Add these services:
   - Name: Electrician, Description: Electrical repairs and installations
   - Name: Plumber, Description: Plumbing services and repairs
   - Name: Carpenter, Description: Carpentry and woodwork services

## Step 3: Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start frontend server
npm start
```

Frontend running at: http://localhost:3000/

## Step 4: Test the Application

### Test as User:
1. Go to http://localhost:3000/register
2. Register as "User (Customer)"
   - Username: john
   - Email: john@example.com
   - Password: john123
3. Login and book a service

### Test as Worker:
1. Register as "Worker (Service Provider)"
   - Username: mike
   - Email: mike@example.com
   - Password: mike123
2. Login as admin and approve the worker
3. Login as worker (mike)

### Test as Admin:
1. Login with admin credentials
2. Approve worker
3. Assign worker to a booking

## Complete Workflow Test

1. **User books service:**
   - Login as john
   - Book Electrician service
   - See status: PENDING

2. **Admin assigns worker:**
   - Login as admin
   - Go to Bookings tab
   - Assign mike to john's booking
   - Status changes to: ASSIGNED

3. **Worker accepts job:**
   - Login as mike
   - View assigned booking
   - Click "Accept"
   - Status changes to: IN_PROGRESS

4. **Worker generates OTP:**
   - Click "Generate OTP"
   - OTP is created (e.g., 123456)

5. **User views OTP:**
   - Login as john
   - Go to OTP page
   - See OTP: 123456
   - Share with worker

6. **Worker verifies OTP:**
   - Login as mike
   - Go to "Verify OTP" page
   - Enter booking ID and OTP
   - Click "Verify OTP & Complete Job"
   - Status changes to: COMPLETED

## 📱 Application URLs

- **Frontend:** http://localhost:3000/
- **Backend API:** http://localhost:8000/api/
- **Django Admin:** http://localhost:8000/admin/

## 🎯 Default Credentials

**Admin:**
- Username: admin
- Password: admin123

**Test User:**
- Username: john
- Password: john123

**Test Worker:**
- Username: mike
- Password: mike123

## ⚡ Quick Commands

### Backend:
```bash
# Run server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Access Python shell
python manage.py shell
```

### Frontend:
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## 🛑 Stop Servers

- Backend: Press `Ctrl + C` in Terminal 1
- Frontend: Press `Ctrl + C` in Terminal 2

## 🔄 Reset Database

```bash
cd backend
rm db.sqlite3
rm -rf core/migrations/0*.py
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

## 📞 Need Help?

Check the main README.md for detailed documentation and troubleshooting.
