/**
 * API configuration for the Home Service Provider application
 * Sets up axios with base URL and authentication headers
 */

import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',  // Django backend API URL
    timeout: 10000,  // 10 second timeout
});

// Request interceptor to add auth token to all requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle specific error cases
        if (error.response?.status === 401) {
            // Token expired or invalid - clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;