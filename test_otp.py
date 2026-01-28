import requests
import json

# Test the OTP generation endpoint
url = "http://127.0.0.1:8000/api/workers/bookings/1/generate-otp/"

# You'll need to replace these with actual credentials
headers = {
    "Authorization": "Token YOUR_WORKER_TOKEN_HERE",
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
