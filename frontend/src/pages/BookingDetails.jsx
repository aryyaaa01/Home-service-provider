/**
 * Booking Details Component
 * Shows detailed information for a specific booking
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import api from "../api";

function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showNotification } = useNotification();

    // Helper function to convert 24-hour time to 12-hour format
    const formatTimeTo12Hour = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12;
        const formattedMinutes = minutes.toString().padStart(2, '0');
        return `${hour12}:${formattedMinutes} ${period}`;
    };

    // Helper function to format the date and time together
    const formatDateTime = (date, time) => {
        if (!date || !time) return `${date || ''} at ${time || ''}`;
        return `${date} at ${formatTimeTo12Hour(time)}`;
    };

    useEffect(() => {
        loadBooking();
    }, [id]);

    const loadBooking = () => {
        // First get all user bookings to get the detailed format
        api.get('bookings/my/')
            .then((res) => {
                const booking = res.data.find(b => b.id.toString() === id);
                if (booking) {
                    setBooking(booking);
                } else {
                    showNotification("Booking not found.", "error");
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching booking:", err);
                showNotification("Failed to load booking details.", "error");
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
            case "DELAYED":
                return "#e67e22";
            case "CANCELLED":
                return "#e74c3c";
            default:
                return "#95a5a6";
        }
    };

    const handleAcceptSuggestion = () => {
        if (!window.confirm('Are you sure you want to accept the new date and time for this booking?')) {
            return;
        }

        api.post(`bookings/${id}/user-respond-to-delayed-service/`, {
            action: 'accept'
        })
            .then((res) => {
                showNotification(res.data.message, "success");
                loadBooking(); // Refresh booking details
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to accept new date. Please try again.";
                showNotification(errorMsg, "error");
            });
    };

    const handleCancelSuggestion = () => {
        if (!window.confirm('Are you sure you want to reject the new date and time for this booking?')) {
            return;
        }

        api.post(`bookings/${id}/user-respond-to-delayed-service/`, {
            action: 'cancel'
        })
            .then((res) => {
                showNotification(res.data.message, "success");
                loadBooking(); // Refresh booking details
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to cancel new date suggestion. Please try again.";
                showNotification(errorMsg, "error");
            });
    };

    const handleCancelBooking = () => {
        if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }

        api.put(`bookings/${id}/cancel/`)
            .then((res) => {
                showNotification(res.data.message, "success");
                loadBooking(); // Refresh booking details
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to cancel booking. Please try again.";
                showNotification(errorMsg, "error");
            });
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <h1>Booking Details</h1>
                <p>Loading booking details...</p>
            </div>
        );
    }

    if (!booking) {
        return (
            <div style={styles.container}>
                <h1>Booking Details</h1>
                <p>Booking not found.</p>
                <button onClick={() => navigate('/booking-history')} style={styles.backButton}>
                    ← Back to Booking History
                </button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => navigate('/booking-history')} style={styles.backButton}>
                    BACK
                </button>
                <h1>Booking Details</h1>
            </div>

            {/* Booking Summary Card */}
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h2>Booking #{booking.id}</h2>
                    <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(booking.status),
                    }}>
                        {booking.status}
                    </span>
                </div>

                <div style={styles.cardContent}>
                    <div style={styles.detailRow}>
                        <strong>Service:</strong>
                        <span>{booking.service_detail?.name}</span>
                    </div>

                    <div style={styles.detailRow}>
                        <strong>Worker:</strong>
                        <span>{booking.worker_username || "Not assigned"}</span>
                    </div>

                    <div style={styles.detailRow}>
                        <strong>Address:</strong>
                        <span>{booking.address}</span>
                    </div>

                    <div style={styles.detailRow}>
                        <strong>Original Scheduled Time:</strong>
                        <span>{formatDateTime(booking.scheduled_date, booking.scheduled_time)}</span>
                    </div>

                    {booking.payment && (
                        <div style={styles.detailRow}>
                            <strong>Payment Amount:</strong>
                            <span>₹{booking.payment.total_amount}</span>
                        </div>
                    )}

                    {/* Payment, Rating and Cancel Options */}
                    <div style={styles.paymentRatingSection}>
                        <div style={styles.paymentRatingRow}>
                            {/* Cancel Booking Option (only for PENDING or ASSIGNED) */}
                            {(booking.status === 'PENDING' || booking.status === 'ASSIGNED') && (
                                <div style={styles.cancelOption}>
                                    <button
                                        onClick={handleCancelBooking}
                                        style={styles.cancelButtonSmall}
                                    >
                                        Cancel Booking
                                    </button>
                                </div>
                            )}

                            {/* Payment Options */}
                            {!booking.payment && (booking.status === 'ASSIGNED' || booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                                <div style={styles.paymentOption}>
                                    <button
                                        onClick={() => navigate(`/payment/${booking.id}`)}
                                        style={styles.payButton}
                                    >
                                        Pay Now
                                    </button>
                                </div>
                            )}

                            {/* Rate and Review Option */}
                            {booking.status === 'COMPLETED' && !booking.is_rated && (
                                <div style={styles.ratingOption}>
                                    <button
                                        onClick={() => navigate(`/rate-review/${booking.id}`)}
                                        style={styles.rateButton}
                                    >
                                        Rate & Review
                                    </button>
                                </div>
                            )}

                            {booking.status === 'COMPLETED' && booking.is_rated && (
                                <div style={styles.ratedIndicator}>
                                    <span style={styles.ratedText}>Rated ✓</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggested Time Card (only if delayed with suggestion) */}
            {booking.status === 'DELAYED' && booking.suggested_date && booking.suggested_time && (
                <div style={styles.suggestionCard}>
                    <div style={styles.suggestionHeader}>
                        <h3>⏰ New Time Suggested</h3>
                    </div>
                    <div style={styles.suggestionContent}>
                        <div style={styles.detailRow}>
                            <strong>Date:</strong>
                            <span>{booking.suggested_date}</span>
                        </div>
                        <div style={styles.detailRow}>
                            <strong>Time:</strong>
                            <span>{formatTimeTo12Hour(booking.suggested_time)}</span>
                        </div>
                    </div>
                    <div style={styles.suggestionActions}>
                        <button onClick={handleAcceptSuggestion} style={styles.acceptButton}>
                            ✅ Accept
                        </button>
                        <button onClick={handleCancelSuggestion} style={styles.cancelButton}>
                            ❌ Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Section */}
            <div style={styles.card}>
                <h3>Payment & Rating</h3>

                {/* Payment Options */}
                {!booking.payment && (booking.status === 'ASSIGNED' || booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS') && (
                    <div style={styles.paymentSection}>
                        <p>Payment pending for this booking.</p>
                        <button
                            onClick={() => navigate(`/payment/${booking.id}`)}
                            style={styles.payButton}
                        >
                            Pay Now
                        </button>
                    </div>
                )}

                {booking.payment && (
                    <div style={styles.paymentInfo}>
                        <div style={styles.detailRow}>
                            <strong>Amount Paid:</strong>
                            <span>₹{booking.payment.total_amount}</span>
                        </div>
                        <div style={styles.detailRow}>
                            <strong>Payment Status:</strong>
                            <span style={{
                                color: booking.payment.payment_status === 'SUCCESS' ? '#27ae60' : '#e74c3c',
                                fontWeight: '500'
                            }}>
                                {booking.payment.payment_status}
                            </span>
                        </div>
                    </div>
                )}

                {/* Rating and Review Section */}
                {booking.status === 'COMPLETED' && (
                    <div style={styles.ratingSection}>
                        <div style={styles.detailRow}>
                            <strong>Rate this service:</strong>
                            {!booking.is_rated ? (
                                <button
                                    onClick={() => navigate(`/rate-review/${booking.id}`)}
                                    style={styles.rateButton}
                                >
                                    Rate & Review
                                </button>
                            ) : (
                                <span style={styles.ratedText}>Already Rated ✓</span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "800px",
        margin: "0 auto",
        padding: "2rem",
    },
    header: {
        display: "flex",
        alignItems: "center",
        marginBottom: "2rem",
        gap: "1rem",
    },
    backButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#34495e",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    card: {
        backgroundColor: "white",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        paddingBottom: "1rem",
        borderBottom: "1px solid #ecf0f1",
    },
    cardContent: {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
    },
    detailRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.5rem 0",
    },
    statusBadge: {
        padding: "0.25rem 1rem",
        borderRadius: "20px",
        color: "white",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
    suggestionCard: {
        backgroundColor: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
    },
    suggestionHeader: {
        marginBottom: "1rem",
    },
    suggestionContent: {
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        marginBottom: "1rem",
    },
    suggestionActions: {
        display: "flex",
        gap: "1rem",
        justifyContent: "flex-start",
    },
    acceptButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#27ae60",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        flex: 1,
    },
    cancelButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        flex: 1,
    },
    paymentSection: {
        marginBottom: "1rem",
    },
    payButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#2ecc71",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    paymentInfo: {
        marginBottom: "1rem",
    },
    ratingSection: {
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #ecf0f1",
    },
    rateButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#f39c12",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    ratedText: {
        padding: "0.5rem 1rem",
        backgroundColor: "#95a5a6",
        color: "white",
        borderRadius: "4px",
        fontWeight: "500",
    },
    paymentRatingSection: {
        marginTop: "1rem",
        paddingTop: "1rem",
        borderTop: "1px solid #ecf0f1",
    },
    paymentRatingRow: {
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap",
    },
    paymentOption: {
        flex: "0 0 auto",
    },
    ratingOption: {
        flex: "0 0 auto",
    },
    ratedIndicator: {
        flex: "0 0 auto",
    },
    cancelOption: {
        flex: "0 0 auto",
    },
    cancelButtonSmall: {
        padding: "0.5rem 1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
};

export default BookingDetails;