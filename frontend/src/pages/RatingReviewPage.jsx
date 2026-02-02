/**
 * Rating Review Page Component
 * Allows users to submit ratings and reviews for completed bookings
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import api from "../api";

function RatingReviewPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Helper function to convert 24-hour time to 12-hour format
    const formatTimeTo12Hour = (time24) => {
        if (!time24) return '';

        // Split the time string (e.g., "13:23") into hours and minutes
        const [hours, minutes] = time24.split(':').map(Number);

        // Validate inputs
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return time24; // Return original if invalid
        }

        // Determine AM or PM
        const period = hours >= 12 ? 'PM' : 'AM';

        // Convert hour from 24-hour to 12-hour format
        const hour12 = hours % 12 || 12; // If hour is 0 or 12, display as 12

        // Format the minutes to always have 2 digits
        const formattedMinutes = minutes.toString().padStart(2, '0');

        return `${hour12}:${formattedMinutes} ${period}`;
    };

    // Helper function to format the date and time together
    const formatDateTime = (date, time) => {
        if (!date || !time) return `${date || ''} at ${time || ''}`;
        return `${date} at ${formatTimeTo12Hour(time)}`;
    };

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await api.get(`/bookings/my/`);
                const bookingData = response.data.find(b => b.id == bookingId);
                if (bookingData) {
                    setBooking(bookingData);
                } else {
                    throw new Error('Booking not found');
                }
            } catch (error) {
                console.error('Error fetching booking:', error);
                showNotification('Error fetching booking details', 'error');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        } else {
            showNotification('Booking ID not provided', 'error');
            navigate(-1);
        }
    }, [bookingId, navigate, showNotification]);

    const handleSubmit = async () => {
        if (rating === 0) {
            showNotification('Please select a rating', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post(`/bookings/${bookingId}/rate/`, {
                rating: rating,
                review: review
            });

            showNotification('Thank you for your rating and review!', 'success');

            // Navigate back to booking history after a delay
            setTimeout(() => {
                navigate('/booking-history');
            }, 2000);
        } catch (error) {
            console.error('Error submitting rating:', error);
            const errorMessage = error.response?.data?.error || 'Failed to submit rating. Please try again.';
            showNotification(errorMessage, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading booking details...</div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Booking not found</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.ratingCard}>
                <h2 style={styles.title}>Rate Your Service Experience</h2>

                <div style={styles.bookingInfo}>
                    <h3>Booking Details</h3>
                    <p><strong>Booking ID:</strong> {booking.id}</p>
                    <p><strong>Service:</strong> {booking.service_detail?.name}</p>
                    <p><strong>Worker:</strong> {booking.worker_username || "Not assigned"}</p>
                    <p><strong>Date:</strong> {formatDateTime(booking.scheduled_date, booking.scheduled_time)}</p>
                </div>

                <div style={styles.ratingSection}>
                    <h3>Your Rating</h3>
                    <div style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                style={{
                                    ...styles.star,
                                    color: star <= rating ? '#f39c12' : '#ddd',
                                    fontSize: '2rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setRating(star)}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <p style={styles.ratingText}>
                        {rating === 0 ? 'Select your rating' : `${rating} Star${rating !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <div style={styles.reviewSection}>
                    <h3>Your Review</h3>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience with this service..."
                        style={styles.textarea}
                        rows="4"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || rating === 0}
                    style={styles.submitButton}
                >
                    {submitting ? 'Submitting...' : 'Submit Rating & Review'}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
    },
    ratingCard: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    title: {
        fontSize: '1.8rem',
        color: '#2c3e50',
        marginBottom: '1.5rem',
        textAlign: 'center',
    },
    bookingInfo: {
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
    },
    ratingSection: {
        marginBottom: '1.5rem',
        textAlign: 'center',
    },
    starsContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
    },
    star: {
        transition: 'color 0.2s ease',
    },
    ratingText: {
        fontSize: '1.1rem',
        color: '#7f8c8d',
        fontWeight: '500',
        margin: '0.5rem 0',
    },
    reviewSection: {
        marginBottom: '1.5rem',
    },
    textarea: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    submitButton: {
        width: '100%',
        padding: '1rem 2rem',
        backgroundColor: '#f39c12',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
    },
    loading: {
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.2rem',
        color: '#7f8c8d',
    },
    error: {
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.2rem',
        color: '#e74c3c',
    },
};

export default RatingReviewPage;