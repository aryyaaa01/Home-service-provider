/**
 * Booking History Component
 * Shows user's booking history in a dedicated page
 */

import React, { useState, useEffect } from "react";
import { useNotification } from "../hooks/useNotification";
import api from "../api";
import RatingReview from "../components/RatingReview.jsx";

function BookingHistory() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

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
        loadBookings();
    }, []);

    const loadBookings = () => {
        api.get("bookings/my/")
            .then((res) => {
                setBookings(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching bookings:", err);
                showNotification("Failed to load booking history.", "error");
                setLoading(false);
            });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "#f39c12";
            case "ASSIGNED":
                return "#3498db";
            case "IN_PROGRESS":
                return "#9b59b6";
            case "COMPLETED":
                return "#27ae60";
            default:
                return "#95a5a6";
        }
    };

    const handlePayment = (bookingId) => {
        // Navigate to the payment page
        window.location.href = `/payment/${bookingId}`;
    };

    const handleCancelBooking = (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }

        api.put(`bookings/${bookingId}/cancel/`, {})
            .then((res) => {
                showNotification(res.data.message, "success");
                loadBookings(); // Refresh bookings list
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to cancel booking. Please try again.";
                showNotification(errorMsg, "error");
            });
    };

    const handleAcceptSuggestion = (bookingId) => {
        if (!window.confirm('Are you sure you want to accept the new date and time for this booking?')) {
            return;
        }

        api.post(`bookings/${bookingId}/user-respond-to-delayed-service/`, {
            action: 'accept'
        })
            .then((res) => {
                showNotification(res.data.message, "success");
                loadBookings(); // Refresh bookings list
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to accept new date. Please try again.";
                showNotification(errorMsg, "error");
            });
    };

    const handleCancelSuggestion = (bookingId) => {
        if (!window.confirm('Are you sure you want to reject the new date and time for this booking?')) {
            return;
        }

        api.post(`bookings/${bookingId}/user-respond-to-delayed-service/`, {
            action: 'cancel'
        })
            .then((res) => {
                showNotification(res.data.message, "success");
                loadBookings(); // Refresh bookings list
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to cancel new date suggestion. Please try again.";
                showNotification(errorMsg, "error");
            });
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <h1>Your Booking History</h1>
                <p>Loading booking history...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1>Your Booking History</h1>
            {bookings.length === 0 ? (
                <p>No bookings found.</p>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>Service</th>
                                <th style={styles.th}>Worker</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Scheduled Time</th>
                                <th style={styles.th}>Suggested Time</th>
                                <th style={styles.th}>Address</th>
                                <th style={styles.th}>Payment</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id} style={styles.tableRow}>
                                    <td style={styles.td}>{b.service_detail?.name}</td>
                                    <td style={styles.td}>{b.worker_username || "Not assigned"}</td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.statusBadge,
                                            backgroundColor: getStatusColor(b.status),
                                        }}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        {formatDateTime(b.scheduled_date, b.scheduled_time)}
                                    </td>
                                    <td style={styles.td}>
                                        {b.suggested_date && b.suggested_time ? (
                                            <div>
                                                <div>New: {formatDateTime(b.suggested_date, b.suggested_time)}</div>
                                                <div>Original: {formatDateTime(b.scheduled_date, b.scheduled_time)}</div>
                                            </div>
                                        ) : (
                                            <span>No suggestion</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>{b.address}</td>
                                    <td style={styles.td}>
                                        {b.payment ? (
                                            <div>
                                                <div>₹{b.payment.total_amount}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#27ae60' }}>
                                                    {b.payment.payment_status === 'SUCCESS' ? 'Completed' : b.payment.payment_status}
                                                </div>
                                            </div>
                                        ) : b.status === 'CANCELLED' ? (
                                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Cancelled</span>
                                        ) : b.status === 'IN_PROGRESS' || b.status === 'COMPLETED' ? (
                                            // Show Pay Now button for IN_PROGRESS (after OTP) and COMPLETED (backwards compatibility)
                                            <button
                                                onClick={() => handlePayment(b.id)}
                                                style={styles.payButton}
                                            >
                                                Pay Now
                                            </button>
                                        ) : (
                                            <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>N/A</span>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        {/* Cancel button for pending/assigned bookings */}
                                        {(b.status === 'PENDING' || b.status === 'ASSIGNED') && (
                                            <button
                                                onClick={() => handleCancelBooking(b.id)}
                                                style={styles.cancelButton}
                                            >
                                                Cancel Service
                                            </button>
                                        )}
                                        {/* Delayed service suggestion actions */}
                                        {b.suggested_date && b.suggested_time && b.status !== 'COMPLETED' && b.status !== 'CANCELLED' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleAcceptSuggestion(b.id)}
                                                    style={{
                                                        ...styles.payButton,
                                                        backgroundColor: '#27ae60',
                                                        color: 'white'
                                                    }}
                                                >
                                                    Accept New Date
                                                </button>
                                                <button
                                                    onClick={() => handleCancelSuggestion(b.id)}
                                                    style={{
                                                        ...styles.cancelButton,
                                                        backgroundColor: '#e74c3c',
                                                        color: 'white'
                                                    }}
                                                >
                                                    Cancel New Date
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>
                                                {b.status === 'COMPLETED' || b.status === 'CANCELLED' ? 'No actions' : 'No suggestion'}
                                            </span>
                                        )}
                                        {/* Rating section - only available for completed and paid bookings */}
                                        {b.status === 'COMPLETED' && b.payment && b.payment.payment_status === 'SUCCESS' && !b.is_rated ? (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <RatingReview
                                                    bookingId={b.id}
                                                    onRatingSubmit={loadBookings} // Refresh data after rating
                                                    compact={true}
                                                />
                                            </div>
                                        ) : b.status === 'COMPLETED' && b.payment && b.payment.payment_status === 'SUCCESS' && b.is_rated ? (
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <span style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '1rem' }}>Rated ✓</span>
                                            </div>
                                        ) : b.status === 'IN_PROGRESS' || (b.status === 'COMPLETED' && (!b.payment || b.payment.payment_status !== 'SUCCESS')) ? (
                                            // For IN_PROGRESS (after OTP) and COMPLETED but not paid
                                            <span style={{ color: '#95a5a6', fontStyle: 'italic', display: 'block', marginTop: '0.5rem' }}>Payment pending</span>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
        minHeight: "80vh", // Ensure minimum height
    },
    tableContainer: {
        overflowX: "auto",
        backgroundColor: "rgba(255, 255, 255, 0.6)", // Light semi-transparent white background
        padding: "1rem",
        borderRadius: "8px",
        backdropFilter: "blur(5px)", // Reduced blur effect
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHeader: {
        backgroundColor: "#34495e",
        color: "white",
    },
    th: {
        padding: "0.75rem",
        textAlign: "left",
    },
    tableRow: {
        borderBottom: "1px solid #ecf0f1",
    },
    td: {
        padding: "0.75rem",
    },
    statusBadge: {
        padding: "0.25rem 0.75rem",
        borderRadius: "12px",
        color: "white",
        fontSize: "0.85rem",
        fontWeight: "500",
    },
    payButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#27ae60",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
    },
    cancelButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
        marginLeft: "0.5rem",
    },
};

export default BookingHistory;