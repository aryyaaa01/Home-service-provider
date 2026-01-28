# 📚 API Documentation

Base URL: `http://localhost:8000/api/`

All authenticated endpoints require `Authorization: Token <token>` header.

---

## 🔐 Authentication

### Register
**POST** `/register/`

Register a new user or worker.

**Request Body:**
```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"  // or "WORKER"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "username": "john",
  "email": "john@example.com",
  "role": "USER",
  "is_approved": true
}
```

---

### Login
**POST** `/login/`

Login and get authentication token.

**Request Body:**
```json
{
  "username": "john",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "USER",
    "is_approved": true
  }
}
```

---

## 🛠️ Services

### List Services
**GET** `/services/`

Get all available services. (Public - No auth required)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Electrician",
    "description": "Electrical repairs and installations",
    "created_at": "2024-01-15T10:00:00Z"
  },
  {
    "id": 2,
    "name": "Plumber",
    "description": "Plumbing services",
    "created_at": "2024-01-15T10:05:00Z"
  }
]
```

---

## 👤 User Endpoints

### Create Booking
**POST** `/bookings/`

Create a new service booking. (Requires USER role)

**Headers:**
```
Authorization: Token <user_token>
```

**Request Body:**
```json
{
  "service": 1,
  "scheduled_date": "2024-01-20",
  "scheduled_time": "14:00",
  "address": "123 Main Street, City"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "user": 1,
  "user_username": "john",
  "service": 1,
  "service_detail": {
    "id": 1,
    "name": "Electrician",
    "description": "Electrical repairs"
  },
  "worker": null,
  "worker_username": null,
  "scheduled_date": "2024-01-20",
  "scheduled_time": "14:00:00",
  "address": "123 Main Street, City",
  "status": "PENDING",
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

---

### Get User's Bookings
**GET** `/bookings/my/`

Get all bookings for the logged-in user.

**Headers:**
```
Authorization: Token <user_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "service_detail": {
      "name": "Electrician"
    },
    "worker_username": "mike",
    "status": "IN_PROGRESS",
    "scheduled_date": "2024-01-20",
    "scheduled_time": "14:00:00",
    "address": "123 Main Street"
  }
]
```

---

### Get User's OTPs
**GET** `/otps/`

Get OTPs for user's bookings.

**Headers:**
```
Authorization: Token <user_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "booking": 1,
    "code": "123456",
    "is_verified": false,
    "created_at": "2024-01-20T16:00:00Z"
  }
]
```

---

## 👷 Worker Endpoints

### Get Worker's Bookings
**GET** `/worker/bookings/`

Get all bookings assigned to the worker.

**Headers:**
```
Authorization: Token <worker_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user_username": "john",
    "service_detail": {
      "name": "Electrician"
    },
    "status": "ASSIGNED",
    "scheduled_date": "2024-01-20",
    "scheduled_time": "14:00:00",
    "address": "123 Main Street"
  }
]
```

---

### Accept/Reject Booking
**POST** `/worker/bookings/<booking_id>/decision/`

Accept or reject an assigned booking.

**Headers:**
```
Authorization: Token <worker_token>
```

**Request Body:**
```json
{
  "action": "accept"  // or "reject"
}
```

**Response (200 OK):**
```json
{
  "detail": "Booking accepted. Status is now IN_PROGRESS."
}
```

---

### Generate OTP
**POST** `/worker/bookings/<booking_id>/generate-otp/`

Generate OTP after completing the job.

**Headers:**
```
Authorization: Token <worker_token>
```

**Response (201 Created):**
```json
{
  "id": 1,
  "booking": 1,
  "code": "123456",
  "is_verified": false,
  "created_at": "2024-01-20T16:00:00Z"
}
```

---

### Verify OTP
**POST** `/worker/verify-otp/`

Verify OTP to complete the job.

**Headers:**
```
Authorization: Token <worker_token>
```

**Request Body:**
```json
{
  "booking_id": 1,
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "detail": "OTP verified. Booking marked as COMPLETED."
}
```

---

## 👨‍💼 Admin Endpoints

### List Workers
**GET** `/admin/workers/`

Get all workers.

**Headers:**
```
Authorization: Token <admin_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "username": "mike",
    "email": "mike@example.com",
    "role": "WORKER",
    "is_approved": false
  }
]
```

---

### List Users
**GET** `/admin/users/`

Get all regular users.

**Headers:**
```
Authorization: Token <admin_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": "USER",
    "is_approved": true
  }
]
```

---

### List All Bookings
**GET** `/admin/bookings/`

Get all bookings in the system.

**Headers:**
```
Authorization: Token <admin_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": 1,
    "user_username": "john",
    "service": 1,
    "service_name": "Electrician",
    "worker": 2,
    "worker_username": "mike",
    "scheduled_date": "2024-01-20",
    "scheduled_time": "14:00:00",
    "address": "123 Main Street",
    "status": "ASSIGNED",
    "created_at": "2024-01-15T11:00:00Z"
  }
]
```

---

### Approve/Reject Worker
**POST** `/admin/workers/<worker_id>/approval/`

Approve or reject a worker account.

**Headers:**
```
Authorization: Token <admin_token>
```

**Request Body:**
```json
{
  "action": "approve"  // or "reject"
}
```

**Response (200 OK):**
```json
{
  "detail": "Worker approved successfully."
}
```

---

### Assign Worker to Booking
**POST** `/admin/bookings/<booking_id>/assign-worker/`

Assign an approved worker to a booking.

**Headers:**
```
Authorization: Token <admin_token>
```

**Request Body:**
```json
{
  "worker_id": 2
}
```

**Response (200 OK):**
```json
{
  "detail": "Worker assigned successfully."
}
```

---

## 🔔 Notifications

### Get Notifications
**GET** `/notifications/`

Get notifications for the logged-in user.

**Headers:**
```
Authorization: Token <user_token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "message": "Booking #1 created for Electrician (status: PENDING).",
    "is_read": false,
    "created_at": "2024-01-15T11:00:00Z"
  },
  {
    "id": 2,
    "message": "Worker mike has been assigned to your Booking #1.",
    "is_read": false,
    "created_at": "2024-01-15T11:30:00Z"
  }
]
```

---

### Mark Notification as Read
**POST** `/notifications/<notification_id>/mark-read/`

Mark a notification as read.

**Headers:**
```
Authorization: Token <user_token>
```

**Response (200 OK):**
```json
{
  "detail": "Notification marked as read."
}
```

---

## 📊 Status Flow

```
Booking Status Flow:
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
```

**Status Descriptions:**
- **PENDING**: Booking created, waiting for admin to assign worker
- **ASSIGNED**: Worker assigned by admin, waiting for worker to accept
- **IN_PROGRESS**: Worker accepted the job and is working on it
- **COMPLETED**: OTP verified, job completed

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid action. Use 'accept' or 'reject'."
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "This booking is not assigned to you."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

---

## 🧪 Testing with cURL

### Login Example:
```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"password123"}'
```

### Create Booking Example:
```bash
curl -X POST http://localhost:8000/api/bookings/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b" \
  -d '{
    "service": 1,
    "scheduled_date": "2024-01-20",
    "scheduled_time": "14:00",
    "address": "123 Main Street"
  }'
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Tokens never expire (can be improved in production)
- Password validation follows Django's default rules
- Workers must be approved before receiving assignments
- OTP is a 6-digit random number
