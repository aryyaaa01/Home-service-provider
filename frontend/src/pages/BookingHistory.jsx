/**
 * Booking History Component
 * Shows user's booking history in a dedicated page
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import api from "../api";

function BookingHistory() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
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
            case "DELAYED":
                return "#e67e22";
            case "CANCELLED":
                return "#e74c3c";
            default:
                return "#95a5a6";
        }
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
                <div style={styles.emptyState}>
                    <p>No bookings found.</p>
                    <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>
                        Book a service to get started!
                    </p>
                </div>
            ) : (
                <div style={styles.tableContainer}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Service</th>
                                <th style={styles.th}>Scheduled Date & Time</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((b) => (
                                <tr key={b.id} style={styles.tableRow}>
                                    <td style={styles.td}>{b.id}</td>
                                    <td style={styles.td}>{b.service_detail?.name}</td>
                                    <td style={styles.td}>
                                        {formatDateTime(b.scheduled_date, b.scheduled_time)}
                                    </td>
                                    <td style={styles.td}>
                                        <span style={{
                                            ...styles.statusBadge,
                                            backgroundColor: getStatusColor(b.status),
                                        }}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionButtonsContainer}>
                                            <button
                                                onClick={() => navigate(`/booking-details/${b.id}`)}
                                                style={styles.viewButton}
                                            >
                                                View Details
                                            </button>
                                        </div>
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
        minHeight: "80vh",
    },
    emptyState: {
        textAlign: "center",
        padding: "3rem",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        borderRadius: "8px",
    },
    tableContainer: {
        overflowX: "auto",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: "1rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
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
        padding: "1rem",
        textAlign: "left",
    },
    tableRow: {
        borderBottom: "1px solid #ecf0f1",
    },
    td: {
        padding: "1rem",
    },
    statusBadge: {
        padding: "0.25rem 1rem",
        borderRadius: "20px",
        color: "white",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
    actionButtonsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
    },
    viewButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
    },
    payButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#2ecc71",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
    },
    rateButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#f39c12",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
    },
    ratedText: {
        padding: "0.5rem 1rem",
        backgroundColor: "#95a5a6",
        color: "white",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
};

export default BookingHistory;