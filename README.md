# Home Service Provider - Full Stack Web Application

A complete home service booking platform built with Django REST Framework (backend) and React (frontend).

## 🎯 Features

### User Roles
1. **User (Customer)** - Book services, view booking status, receive OTP
2. **Worker (Service Provider)** - Accept/reject jobs, complete jobs with OTP verification
3. **Admin** - Manage users, approve workers, assign workers to bookings

### Core Functionality
- ✅ User registration and login
- ✅ Service browsing and booking
- ✅ Booking status tracking (Pending → Assigned → In Progress → Completed)
- ✅ Worker approval system
- ✅ Job assignment by admin
- ✅ OTP-based job completion verification
- ✅ Real-time notifications
- ✅ Booking history

## 🛠️ Tech Stack

**Backend:**
- Django 4.2+
- Django REST Framework
- Token Authentication
- SQLite Database
- django-cors-headers

**Frontend:**
- React 18
- React Router v6
- Axios
- CSS-in-JS styling

## 📁 Project Structure

```
HomeServiceProvider/
├── backend/
│   ├── home_service/          # Django project settings
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── core/                  # Main Django app
│   │   ├── models.py          # User, Service, Booking, OTP, Notification
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # API endpoints
│   │   ├── urls.py            # API routes
│   │   ├── permissions.py     # Custom permissions
│   │   ├── admin.py           # Django admin config
│   │   └── migrations/
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── Navbar.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── UserDashboard.js
    │   │   ├── WorkerDashboard.js
    │   │   ├── AdminDashboard.js
    │   │   └── OTPPage.js
    │   ├── api.js             # Axios configuration
    │   ├── App.js             # Main app component
    │   ├── index.js           # Entry point
    │   └── index.css
    └── package.json
```

## 🚀 Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment:**
   - macOS/Linux:
     ```bash
     source venv/bin/activate
     ```
   - Windows:
     ```bash
     venv\Scripts\activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create superuser (Admin):**
   ```bash
   python manage.py createsuperuser
   ```
   - Enter username, email, and password
   - This user will be your admin

7. **Update admin role (IMPORTANT):**
   ```bash
   python manage.py shell
   ```
   Then in the Python shell:
   ```python
   from core.models import User
   admin = User.objects.get(username='your_admin_username')
   admin.role = 'ADMIN'
   admin.save()
   exit()
   ```

8. **Create some services (optional):**
   - Start the server (see step 9)
   - Go to http://localhost:8000/admin/
   - Login with your admin credentials
   - Add services like "Electrician", "Plumber", "Carpenter", etc.

9. **Run development server:**
   ```bash
   python manage.py runserver
   ```
   Backend will be available at: http://localhost:8000/

### Frontend Setup

1. **Open a new terminal and navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   Frontend will be available at: http://localhost:3000/

## 📖 Usage Guide

### For Users (Customers)

1. **Register:**
   - Go to http://localhost:3000/register
   - Choose role: "User (Customer)"
   - Fill in details and register

2. **Login:**
   - Login with your credentials
   - You'll be redirected to User Dashboard

3. **Book a Service:**
   - Select a service from the dropdown
   - Choose date, time, and enter address
   - Click "Book Service"
   - Booking status will be "PENDING"

4. **Track Booking:**
   - View all your bookings in the dashboard
   - Admin will assign a worker (status: ASSIGNED)
   - Worker accepts job (status: IN_PROGRESS)
   - Worker generates OTP after completion

5. **View OTP:**
   - Go to "OTP" page in navbar
   - View the OTP for your completed booking
   - Share this OTP with the worker
   - Worker verifies OTP (status: COMPLETED)

### For Workers (Service Providers)

1. **Register:**
   - Go to http://localhost:3000/register
   - Choose role: "Worker (Service Provider)"
   - Fill in details and register
   - **Wait for admin approval**

2. **Login (after approval):**
   - Login with your credentials
   - You'll be redirected to Worker Dashboard

3. **View Assigned Jobs:**
   - All jobs assigned to you will appear in the dashboard

4. **Accept/Reject Job:**
   - Click "Accept" to start the job
   - Click "Reject" if you can't complete it

5. **Complete Job:**
   - After completing the job, click "Generate OTP"
   - An OTP will be created and shown to the customer
   - Ask customer for the OTP

6. **Verify OTP:**
   - Go to "Verify OTP" page
   - Enter booking ID and OTP code
   - Click "Verify OTP & Complete Job"
   - Job will be marked as COMPLETED

### For Admin

1. **Login:**
   - Login with admin credentials
   - You'll be redirected to Admin Dashboard

2. **Approve Workers:**
   - Go to "Workers" tab
   - View pending workers
   - Click "Approve" or "Reject"

3. **Assign Workers to Bookings:**
   - Go to "Bookings" tab
   - Select a pending booking
   - Choose an approved worker
   - Click "Assign Worker"
   - Booking status changes to ASSIGNED

4. **View All Data:**
   - View all users in "Users" tab
   - View all bookings in "Bookings" tab
   - Use Django admin for advanced management

## 🔑 API Endpoints

### Authentication
- `POST /api/register/` - User/Worker registration
- `POST /api/login/` - Login (returns token)

### Services
- `GET /api/services/` - List all services

### User Endpoints
- `POST /api/bookings/` - Create booking
- `GET /api/bookings/my/` - View user's bookings
- `GET /api/otps/` - View user's OTPs

### Worker Endpoints
- `GET /api/worker/bookings/` - View assigned bookings
- `POST /api/worker/bookings/<id>/decision/` - Accept/reject booking
- `POST /api/worker/bookings/<id>/generate-otp/` - Generate OTP
- `POST /api/worker/verify-otp/` - Verify OTP and complete job

### Admin Endpoints
- `GET /api/admin/workers/` - List all workers
- `GET /api/admin/users/` - List all users
- `GET /api/admin/bookings/` - List all bookings
- `POST /api/admin/workers/<id>/approval/` - Approve/reject worker
- `POST /api/admin/bookings/<id>/assign-worker/` - Assign worker

### Notifications
- `GET /api/notifications/` - List user's notifications

## 🎨 Booking Status Flow

```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
   ↓          ↓            ↓            ↓
Created   Worker     Worker      OTP
by User   Assigned   Accepts   Verified
```

## 🔒 Security Features

- Token-based authentication
- Role-based access control
- Password hashing
- CORS configuration
- Permission classes for different user roles

## 📝 Testing the Application

1. **Create Admin:**
   - Use Django management command to create superuser
   - Set role to ADMIN

2. **Create Services:**
   - Login to Django admin
   - Add services (Electrician, Plumber, etc.)

3. **Test User Flow:**
   - Register as User
   - Login and book a service
   - View booking status

4. **Test Worker Flow:**
   - Register as Worker
   - Wait for admin approval (or approve via admin panel)
   - Login and view assigned jobs
   - Accept job, generate OTP, verify OTP

5. **Test Admin Flow:**
   - Login as Admin
   - Approve workers
   - Assign workers to bookings
   - View all data

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
python manage.py runserver 8001
```

**Database errors:**
```bash
rm db.sqlite3
python manage.py migrate
```

**CORS errors:**
- Make sure django-cors-headers is installed
- Check CORS_ALLOWED_ORIGINS in settings.py

### Frontend Issues

**Port already in use:**
- Change port in package.json or use:
```bash
PORT=3001 npm start
```

**API connection errors:**
- Check API_BASE_URL in src/api.js
- Ensure backend is running

## 🚧 Future Enhancements (Out of Scope)

- Payment integration
- Real-time chat
- SMS/Email notifications
- Rating and review system
- Service provider profiles with photos
- Google Maps integration
- Mobile app

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Author

Built with Django REST Framework and React
