/**
 * Worker Dashboard
 * Shows assigned bookings and allows worker to accept/reject and generate OTP
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../api";

function WorkerDashboard() {
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [workerRatings, setWorkerRatings] = useState([]);
    const [loading, setLoading] = useState({});
    const [loadingBookings, setLoadingBookings] = useState(true);
    const location = useLocation();

    const formatTimeTo12Hour = (time24) => {
        if (!time24) return "";
        const [h, m] = time24.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
    };

    const formatDateTime = (date, time) =>
        date && time ? `${date} at ${formatTimeTo12Hour(time)}` : "N/A";

    const activeSection =
        location.hash.replace("#", "") || "assigned-bookings";

    useEffect(() => {
        // Load bookings
        setLoadingBookings(true);
        api.get("workers/bookings/")
            .then((res) => {
                setBookings(res.data);
            })
            .catch((error) => {
                console.error("Error loading bookings:", error);
                alert("Failed to load bookings. Please try again.");
            })
            .finally(() => {
                setLoadingBookings(false);
            });

        // Load ratings
        api.get("workers/me/ratings/")
            .then((res) => {
                setWorkerRatings(res.data);
            })
            .catch((error) => {
                console.error("Error loading ratings:", error);
                // Don't show alert for ratings as it's less critical
            });

        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const res = await api.get("/notifications/");
            console.log("Notifications API response:", res);
            console.log("Notifications data:", res.data);
            console.log("Number of notifications:", res.data.length);
            setNotifications(res.data);
        } catch (error) {
            console.error("Error loading notifications:", error);
            console.error("Notifications error response:", error.response?.data);
            console.error("Notifications error status:", error.response?.status);
            // Don't show alert for notifications as it's less critical
        } finally {
            setLoadingNotifications(false);
        }
    };

    const handleDecision = (id, action) => {
        setLoading({ ...loading, [id]: true });

        api
            .post(`workers/bookings/${id}/decision/`, { decision: action })
            .then(() => api.get("workers/bookings/"))
            .then((res) => setBookings(res.data))
            .finally(() => setLoading({ ...loading, [id]: false }));
    };

    const handleGenerateOTP = (id) => {
        setLoading({ ...loading, [`otp_${id}`]: true });

        api
            .post(`workers/bookings/${id}/generate-otp/`)
            .then(() => alert("OTP generated successfully"))
            .then(() => api.get("workers/bookings/"))
            .then((res) => setBookings(res.data))
            .finally(() =>
                setLoading({ ...loading, [`otp_${id}`]: false })
            );
    };

    const handleMarkReached = (id) => {
        setLoading({ ...loading, [`reached_${id}`]: true });

        api
            .post(`bookings/${id}/mark-reached/`)
            .then(() => api.get("workers/bookings/"))
            .then((res) => setBookings(res.data))
            .finally(() =>
                setLoading({ ...loading, [`reached_${id}`]: false })
            );
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "ASSIGNED":
                return "#3498db";
            case "REACHED":
                return "#1abc9c";
            case "COMPLETED":
                return "#27ae60";
            case "CANCELLED":
                return "#e74c3c";
            default:
                return "#95a5a6";
        }
    };

    const calculateAverageRating = (ratings) => {
        if (!ratings.length) return 0;
        return (
            ratings.reduce((a, b) => a + b.rating, 0) /
            ratings.length
        );
    };

    return (
        <div style={styles.container}>
            {/* YOUR PERFORMANCE */}
            {(activeSection === "all" ||
                activeSection === "performance") && (
                    <div style={styles.performanceSection}>
                        <div style={styles.welcomeHeader}>
                            <h1 style={styles.welcomeTitle}>Welcome, {localStorage.getItem('username') || localStorage.getItem('user') || 'Worker'}!</h1>
                            <h2 style={styles.dashboardTitle}>Service Provider Dashboard</h2>
                        </div>

                        <h2 style={styles.performanceTitle}>Your Performance</h2>
                        {loadingBookings ? (
                            <div style={styles.loadingStats}>
                                <p>Loading your performance statistics...</p>
                            </div>
                        ) : (
                            <div style={styles.performanceGrid}>
                                <div style={styles.performanceCard}>
                                    <div style={styles.cardIcon}>📋</div>
                                    <div style={styles.cardContent}>
                                        <div style={styles.cardNumber}>{bookings.length}</div>
                                        <div style={styles.cardLabel}>Total Jobs</div>
                                    </div>
                                </div>

                                <div style={styles.performanceCard}>
                                    <div style={styles.cardIcon}>✅</div>
                                    <div style={styles.cardContent}>
                                        <div style={styles.cardNumber}>
                                            {bookings.filter(b => b.status === "COMPLETED").length}
                                        </div>
                                        <div style={styles.cardLabel}>Completed</div>
                                    </div>
                                </div>

                                <div style={styles.performanceCard}>
                                    <div style={styles.cardIcon}>⏳</div>
                                    <div style={styles.cardContent}>
                                        <div style={styles.cardNumber}>
                                            {bookings.filter(b => ["ASSIGNED", "CONFIRMED"].includes(b.status)).length}
                                        </div>
                                        <div style={styles.cardLabel}>Pending</div>
                                    </div>
                                </div>

                                <div style={styles.performanceCard}>
                                    <div style={styles.cardIcon}>🔧</div>
                                    <div style={styles.cardContent}>
                                        <div style={styles.cardNumber}>
                                            {bookings.filter(b => b.status === "IN_PROGRESS").length}
                                        </div>
                                        <div style={styles.cardLabel}>In Progress</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={styles.quickActions}>
                            <h3 style={styles.actionsTitle}>Quick Actions</h3>
                            <div style={styles.actionsGrid}>
                                <button
                                    style={styles.actionButtonLarge}
                                    onClick={() => window.location.hash = "#assigned-bookings"}
                                >
                                    <div style={styles.actionIcon}>📋</div>
                                    <div>
                                        <div style={styles.actionTitle}>View All Bookings</div>
                                        <div style={styles.actionSubtitle}>Manage your assigned jobs and accept new ones</div>
                                    </div>
                                </button>

                                <button
                                    style={styles.actionButtonLarge}
                                    onClick={() => window.location.hash = "#reviews"}
                                >
                                    <div style={styles.actionIcon}>💰</div>
                                    <div>
                                        <div style={styles.actionTitle}>Earnings</div>
                                        <div style={styles.actionSubtitle}>Track your payments and earnings</div>
                                    </div>
                                </button>

                                <button
                                    style={styles.actionButtonLarge}
                                    onClick={() => window.location.hash = "#notifications"}
                                >
                                    <div style={styles.actionIcon}>⚙️</div>
                                    <div>
                                        <div style={styles.actionTitle}>Profile Settings</div>
                                        <div style={styles.actionSubtitle}>Update your personal information</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div style={styles.recentActivity}>
                            <h3 style={styles.activityTitle}>Recent Activity</h3>
                            {bookings.length > 0 ? (
                                <div style={styles.activityList}>
                                    {bookings
                                        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
                                        .slice(0, 3)
                                        .map(booking => (
                                            <div key={booking.id} style={styles.activityItem}>
                                                <div style={styles.activityIcon}>📋</div>
                                                <div style={styles.activityContent}>
                                                    <div style={styles.activityText}>
                                                        Booking #{booking.id} - {booking.service_detail?.name || booking.service_name}
                                                    </div>
                                                    <div style={styles.activityStatus}>
                                                        <span style={{
                                                            ...styles.statusBadgeSmall,
                                                            backgroundColor: getStatusColor(booking.status)
                                                        }}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={styles.activityDate}>
                                                    {new Date(booking.updated_at || booking.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div style={styles.noActivity}>
                                    <div style={styles.noActivityIcon}>📋</div>
                                    <div style={styles.noActivityText}>No recent activity to display</div>
                                    <div style={styles.noActivitySubtext}>
                                        Your recent bookings and notifications will appear here
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* ASSIGNED BOOKINGS */}
            {
                (activeSection === "all" ||
                    activeSection === "assigned-bookings") && (
                    <div style={styles.bookingsCard}>
                        <h2 style={styles.sectionTitle}>Assigned Bookings</h2>

                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Service</th>
                                        <th style={styles.th}>Customer</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Schedule</th>
                                        <th style={styles.th}>Address</th>
                                        <th style={styles.th}>Payment</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id} style={styles.tableRow}>
                                            <td style={styles.td}>{b.id}</td>
                                            <td style={styles.td}>
                                                {b.service_detail?.name}
                                            </td>
                                            <td style={styles.td}>{b.user_username}</td>

                                            <td style={styles.td}>
                                                <span
                                                    style={{
                                                        ...styles.statusBadge,
                                                        backgroundColor: getStatusColor(
                                                            b.status
                                                        ),
                                                    }}
                                                >
                                                    {b.status}
                                                </span>
                                            </td>

                                            <td style={styles.td}>
                                                {b.date || b.time_slot ? (
                                                    <>
                                                        {b.date && <div>{b.date}</div>}
                                                        {b.time_slot && <div style={styles.timeText}>{formatTimeTo12Hour(b.time_slot)}</div>}
                                                    </>
                                                ) : (
                                                    <span style={styles.naText}>—</span>
                                                )}
                                            </td>

                                            <td style={styles.td}>{b.address}</td>

                                            <td style={styles.td}>
                                                {b.payment ? (
                                                    <>
                                                        <div style={styles.amountText}>₹{b.payment.provider_amount}</div>
                                                        <div style={styles.paymentStatus}>
                                                            {b.payment.payment_status}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span style={styles.notPaidText}>
                                                        Not paid
                                                    </span>
                                                )}
                                            </td>

                                            <td style={styles.td}>
                                                <div style={styles.actionsContainer}>
                                                    {b.status === "ASSIGNED" && (
                                                        <>
                                                            <button
                                                                style={{ ...styles.actionButton, ...styles.acceptButton }}
                                                                onClick={() =>
                                                                    handleDecision(b.id, "accept")
                                                                }
                                                            >
                                                                Accept
                                                            </button>

                                                            <button
                                                                style={{ ...styles.actionButton, ...styles.rejectButton }}
                                                                onClick={() =>
                                                                    handleDecision(b.id, "reject")
                                                                }
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {b.status === "CONFIRMED" && (
                                                        <button
                                                            style={{ ...styles.actionButton, ...styles.reachedButton }}
                                                            onClick={() =>
                                                                handleMarkReached(b.id)
                                                            }
                                                        >
                                                            Mark Reached
                                                        </button>
                                                    )}

                                                    {b.status === "REACHED" && (
                                                        <button
                                                            style={{ ...styles.actionButton, ...styles.generateOtpButton }}
                                                            onClick={() =>
                                                                handleGenerateOTP(b.id)
                                                            }
                                                        >
                                                            Generate OTP
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }

            {/* CUSTOMER REVIEWS */}
            {
                (activeSection === "all" ||
                    activeSection === "reviews") && (
                    <div style={styles.reviewsSection}>
                        <h2 style={styles.reviewsTitle}>Customer Reviews</h2>

                        {workerRatings.length === 0 ? (
                            <div style={styles.noReviewsContainer}>
                                <div style={styles.noReviewsIcon}>💬</div>
                                <h3 style={styles.noReviewsTitle}>No Reviews Yet</h3>
                                <p style={styles.noReviewsText}>Complete more bookings to receive feedback from your customers.</p>
                            </div>
                        ) : (
                            <div style={styles.reviewsContent}>
                                <div style={styles.ratingSummary}>
                                    <div style={styles.averageRatingBox}>
                                        <div style={styles.ratingNumber}>
                                            {calculateAverageRating(workerRatings).toFixed(1)}
                                        </div>
                                        <div style={styles.ratingStars}>
                                            {'⭐'.repeat(Math.floor(calculateAverageRating(workerRatings)))}
                                        </div>
                                        <div style={styles.ratingCount}>
                                            {workerRatings.length} review{workerRatings.length !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                <div style={styles.reviewsContainer}>
                                    {workerRatings.map((rating) => (
                                        <div key={rating.id} style={styles.reviewCard}>
                                            <div style={styles.reviewHeader}>
                                                <div style={styles.reviewRatingSection}>
                                                    <div style={styles.reviewStars}>
                                                        {'⭐'.repeat(rating.rating)}
                                                        <span style={styles.ratingOutOf}>
                                                            ({rating.rating}/5)
                                                        </span>
                                                    </div>
                                                    <span style={styles.reviewServiceBadge}>
                                                        {rating.service?.name || 'Service'}</span>
                                                </div>
                                            </div>

                                            <div style={styles.reviewBody}>
                                                <p style={styles.reviewText}>
                                                    {rating.review || 'No review comment provided'}
                                                </p>
                                            </div>

                                            <div style={styles.reviewFooter}>
                                                <div style={styles.reviewerInfo}>
                                                    <span style={styles.reviewCustomer}>
                                                        👤 {rating.user || rating.user_username || 'Anonymous User'}
                                                    </span>
                                                </div>
                                                <span style={styles.reviewDate}>
                                                    📅 {new Date(rating.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

            {/* NOTIFICATIONS */}
            {
                (activeSection === "all" ||
                    activeSection === "notifications") && (
                    <div style={styles.section}>
                        <h2>Notifications</h2>

                        {loadingNotifications ? (
                            <p>Loading...</p>
                        ) : (
                            notifications.map((n) => (
                                <div key={n.id} style={styles.notificationItem}>
                                    <strong>{n.title}</strong>
                                    <p>{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                )
            }
        </div >
    );
}

const styles = {
    // Performance section
    performanceSection: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e9ecef",
    },

    performanceTitle: {
        fontSize: "1.5rem",
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: "2rem",
        textAlign: "center",
    },

    performanceGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem",
    },

    performanceCard: {
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        border: "1px solid #e9ecef",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },

    performanceCardHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },

    cardIcon: {
        fontSize: "2rem",
    },

    cardContent: {
        flex: 1,
    },

    cardNumber: {
        fontSize: "2rem",
        fontWeight: "700",
        color: "#2c3e50",
        marginBottom: "0.25rem",
    },

    cardLabel: {
        fontSize: "0.9rem",
        color: "#6c757d",
        fontWeight: "500",
    },

    // Quick actions
    quickActions: {
        marginBottom: "2rem",
    },

    actionsTitle: {
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: "1rem",
    },

    actionsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
    },

    actionButtonLarge: {
        backgroundColor: "#ffffff",
        border: "1px solid #e9ecef",
        borderRadius: "10px",
        padding: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        textAlign: "left",
        width: "100%",
    },

    actionButtonLargeHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        borderColor: "#3498db",
    },

    actionIcon: {
        fontSize: "1.5rem",
    },

    actionTitle: {
        fontSize: "1rem",
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: "0.25rem",
    },

    actionSubtitle: {
        fontSize: "0.85rem",
        color: "#6c757d",
        lineHeight: "1.4",
    },

    // Recent activity
    recentActivity: {
        borderTop: "1px solid #e9ecef",
        paddingTop: "2rem",
    },

    activityTitle: {
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: "1rem",
    },

    activityList: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },

    activityItem: {
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #e9ecef",
    },

    activityIcon: {
        fontSize: "1.2rem",
    },

    activityContent: {
        flex: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
    },

    activityText: {
        fontSize: "0.95rem",
        color: "#495057",
        fontWeight: "500",
    },

    activityStatus: {
        display: "flex",
        alignItems: "center",
    },

    statusBadgeSmall: {
        padding: "0.25rem 0.75rem",
        borderRadius: "12px",
        color: "#fff",
        fontSize: "0.75rem",
        fontWeight: "500",
    },

    activityDate: {
        fontSize: "0.85rem",
        color: "#6c757d",
        minWidth: "80px",
        textAlign: "right",
    },

    noActivity: {
        textAlign: "center",
        padding: "2rem",
        color: "#6c757d",
    },

    noActivityIcon: {
        fontSize: "2rem",
        marginBottom: "1rem",
    },

    noActivityText: {
        fontSize: "1rem",
        fontWeight: "500",
        color: "#495057",
        marginBottom: "0.5rem",
    },

    noActivitySubtext: {
        fontSize: "0.9rem",
        color: "#6c757d",
        lineHeight: "1.5",
    },
    // Page container with clean background
    container: {
        padding: "2rem",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
    },

    // Welcome header styling
    welcomeHeader: {
        textAlign: "center",
        marginBottom: "2rem",
    },

    welcomeTitle: {
        fontSize: "2rem",
        fontWeight: "600",
        color: "#2c3e50",
        margin: 0,
        marginBottom: "0.5rem",
    },
    loadingStats: {
        textAlign: "center",
        padding: "2rem",
        fontSize: "1.1rem",
        color: "#6c757d",
    },

    dashboardTitle: {
        fontSize: "1.5rem",
        fontWeight: "500",
        color: "#7f8c8d",
        margin: 0,
        marginBottom: "2rem",
    },

    // Main bookings card
    bookingsCard: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e9ecef",
    },

    // Section title
    sectionTitle: {
        fontSize: "1.5rem",
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: "1.5rem",
        textAlign: "center",
    },

    // Table container
    tableContainer: {
        overflowX: "auto",
        borderRadius: "8px",
        border: "1px solid #e9ecef",
    },

    // Table styling
    table: {
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "#fff",
    },

    // Table header
    tableHeader: {
        background: "#34495e",
        color: "#fff",
    },

    // Table header cells
    th: {
        padding: "1rem",
        textAlign: "left",
        fontWeight: "600",
        fontSize: "0.9rem",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },

    // Table rows
    tableRow: {
        borderBottom: "1px solid #e9ecef",
        transition: "background-color 0.2s ease",
    },

    // Table data cells
    td: {
        padding: "1.25rem 1rem",
        verticalAlign: "middle",
        fontSize: "0.95rem",
        color: "#495057",
    },

    // Status badges
    statusBadge: {
        padding: "0.5rem 1rem",
        borderRadius: "20px",
        color: "#fff",
        fontSize: "0.85rem",
        fontWeight: "500",
        display: "inline-block",
        minWidth: "100px",
        textAlign: "center",
    },

    // Schedule display
    timeText: {
        color: "#6c757d",
        fontSize: "0.85rem",
        marginTop: "0.25rem",
    },

    naText: {
        color: "#adb5bd",
        fontStyle: "italic",
    },

    // Payment information
    amountText: {
        fontWeight: "600",
        color: "#2c3e50",
    },

    paymentStatus: {
        color: "#27ae60",
        fontSize: "0.85rem",
        fontWeight: "500",
        marginTop: "0.25rem",
    },

    notPaidText: {
        color: "#6c757d",
        fontStyle: "italic",
    },

    // Actions container
    actionsContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        alignItems: "flex-start",
    },

    // Action buttons base style
    actionButton: {
        padding: "0.6rem 1.2rem",
        borderRadius: "6px",
        border: "none",
        fontSize: "0.85rem",
        fontWeight: "500",
        cursor: "pointer",
        transition: "all 0.2s ease",
        minWidth: "120px",
        textAlign: "center",
    },

    // Specific button styles
    acceptButton: {
        background: "#27ae60",
        color: "#fff",
    },

    rejectButton: {
        background: "#e74c3c",
        color: "#fff",
    },

    reachedButton: {
        background: "#3498db",
        color: "#fff",
    },

    generateOtpButton: {
        background: "#f39c12",
        color: "#fff",
    },
    // Reviews section styling
    reviewsSection: {
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid #e9ecef",
    },

    reviewsTitle: {
        fontSize: "1.5rem",
        fontWeight: "600",
        color: "#2c3e50",
        marginBottom: "1.5rem",
        textAlign: "center",
    },

    // No reviews state
    noReviewsContainer: {
        textAlign: "center",
        padding: "3rem 2rem",
        color: "#6c757d",
    },

    noReviewsIcon: {
        fontSize: "3rem",
        marginBottom: "1rem",
    },

    noReviewsTitle: {
        fontSize: "1.25rem",
        fontWeight: "600",
        color: "#495057",
        marginBottom: "0.5rem",
    },

    noReviewsText: {
        fontSize: "1rem",
        color: "#6c757d",
        maxWidth: "400px",
        margin: "0 auto",
        lineHeight: "1.6",
    },

    // Reviews content
    reviewsContent: {
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
    },

    // Rating summary
    ratingSummary: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1.5rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "10px",
        border: "1px solid #e9ecef",
    },

    averageRatingBox: {
        textAlign: "center",
        padding: "1rem 2rem",
    },

    ratingNumber: {
        fontSize: "2.5rem",
        fontWeight: "700",
        color: "#f39c12",
        marginBottom: "0.5rem",
    },

    ratingStars: {
        fontSize: "1.5rem",
        marginBottom: "0.5rem",
        color: "#f39c12",
    },

    ratingCount: {
        fontSize: "0.9rem",
        color: "#6c757d",
        fontWeight: "500",
    },

    // Reviews container
    reviewsContainer: {
        display: "grid",
        gap: "1.5rem",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    },

    // Review card
    reviewCard: {
        background: "#ffffff",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #e9ecef",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },

    reviewCardHover: {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },

    // Review header
    reviewHeader: {
        marginBottom: "1rem",
    },

    reviewRatingSection: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.5rem",
    },

    reviewStars: {
        fontSize: "1.2rem",
        color: "#f39c12",
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
    },

    ratingOutOf: {
        fontSize: "0.9rem",
        color: "#6c757d",
        marginLeft: "0.25rem",
    },

    reviewServiceBadge: {
        backgroundColor: "#3498db",
        color: "#fff",
        padding: "0.25rem 0.75rem",
        borderRadius: "20px",
        fontSize: "0.8rem",
        fontWeight: "500",
    },

    // Review body
    reviewBody: {
        marginBottom: "1rem",
    },

    reviewText: {
        margin: 0,
        lineHeight: "1.6",
        color: "#495057",
        fontSize: "0.95rem",
    },

    // Review footer
    reviewFooter: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "1rem",
        borderTop: "1px solid #e9ecef",
        fontSize: "0.85rem",
        color: "#6c757d",
    },

    reviewerInfo: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
    },

    reviewCustomer: {
        fontWeight: "500",
        color: "#2c3e50",
    },

    reviewDate: {
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
    },
};

export default WorkerDashboard;