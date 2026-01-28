/**
 * Worker Home Page Component
 * Post-login home page for workers with service provider focus
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function WorkerHome() {
    const [workerInfo, setWorkerInfo] = useState(null);
    const [stats, setStats] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch worker profile and stats
        Promise.all([
            api.get("profile/"),
            api.get("worker/bookings/"),
            api.get("notifications/")
        ])
            .then(([profileRes, bookingsRes, notificationsRes]) => {
                setWorkerInfo(profileRes.data);

                // Calculate stats
                const bookings = bookingsRes.data;
                const completed = bookings.filter(b => b.status === 'COMPLETED').length;
                const pending = bookings.filter(b => b.status === 'ASSIGNED' || b.status === 'CONFIRMED').length;
                const inProgress = bookings.filter(b => b.status === 'IN_PROGRESS').length;

                setStats({
                    totalBookings: bookings.length,
                    completed,
                    pending,
                    inProgress
                });

                // Set notifications
                setNotifications(notificationsRes.data);

                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading worker data:", err);
                setLoading(false);
            });
    }, []);



    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading worker dashboard...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.welcome}>Welcome, {workerInfo?.username}!</h1>
                    <p style={styles.subtitle}>Service Provider Dashboard</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={styles.statsSection}>
                <h2 style={styles.sectionTitle}>Your Performance</h2>
                <div style={styles.statsGrid}>
                    <div style={styles.statCard} onClick={() => navigate('/worker-dashboard')} className="clickable">
                        <div style={styles.statIcon}>📋</div>
                        <div style={styles.statNumber}>{stats.totalBookings}</div>
                        <div style={styles.statLabel}>Total Jobs</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/worker-dashboard')} className="clickable">
                        <div style={styles.statIcon}>✅</div>
                        <div style={styles.statNumber}>{stats.completed}</div>
                        <div style={styles.statLabel}>Completed</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/worker-dashboard')} className="clickable">
                        <div style={styles.statIcon}>⏳</div>
                        <div style={styles.statNumber}>{stats.pending}</div>
                        <div style={styles.statLabel}>Pending</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/worker-dashboard')} className="clickable">
                        <div style={styles.statIcon}>🔧</div>
                        <div style={styles.statNumber}>{stats.inProgress}</div>
                        <div style={styles.statLabel}>In Progress</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.actionsSection}>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={styles.actionsGrid}>
                    <div style={styles.actionCard} onClick={() => navigate('/worker-dashboard')} className="clickable">
                        <div style={styles.actionIcon}>📋</div>
                        <h3>View All Bookings</h3>
                        <p>Manage your assigned jobs and accept new ones</p>
                    </div>
                    <div style={styles.actionCard} onClick={() => navigate('/earnings')} className="clickable">
                        <div style={styles.actionIcon}>💰</div>
                        <h3>Earnings</h3>
                        <p>Track your payments and earnings</p>
                    </div>
                    <div style={styles.actionCard} onClick={() => navigate('/profile')} className="clickable">
                        <div style={styles.actionIcon}>⚙️</div>
                        <h3>Profile Settings</h3>
                        <p>Update your personal information</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={styles.activitySection}>
                <h2 style={styles.sectionTitle}>Recent Activity</h2>
                <div style={styles.activityList}>
                    {notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} style={styles.activityItem}>
                            <div style={styles.activityIcon}>
                                {notification.notification_type === 'ASSIGNMENT' ? '👤' :
                                    notification.notification_type === 'BOOKING_STATUS' ? '📋' :
                                        notification.notification_type === 'OTP' ? '🔢' :
                                            notification.notification_type === 'PAYMENT' ? '💳' :
                                                notification.notification_type === 'BOOKING_REJECTION' ? '❌' : '🔔'}
                            </div>
                            <div style={styles.activityContent}>
                                <h3>{notification.title}</h3>
                                <p>{notification.message}</p>
                                <span style={styles.activityTime}>{new Date(notification.created_at).toLocaleString()}</span>
                                {!notification.is_read && (
                                    <span style={{ color: '#3498db', fontWeight: 'bold', marginLeft: '0.5rem' }}>(New)</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {notifications.length === 0 && (
                    <div style={styles.activityPlaceholder}>
                        <p>📋 No recent activity to display</p>
                        <p style={styles.activitySubtext}>Your recent bookings and notifications will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        backgroundColor: "rgba(52, 152, 219, 0.1)",
        padding: "1.5rem",
        borderRadius: "8px",
    },
    welcome: {
        fontSize: "2rem",
        color: "#2c3e50",
        margin: "0 0 0.5rem 0",
    },
    subtitle: {
        fontSize: "1.1rem",
        color: "#7f8c8d",
        margin: "0",
    },
    headerActions: {},
    logoutBtn: {
        padding: "0.5rem 1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    statsSection: {
        marginBottom: "2rem",
    },
    sectionTitle: {
        fontSize: "1.5rem",
        color: "#2c3e50",
        marginBottom: "1rem",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
    },
    statCard: {
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "transform 0.2s",
    },
    statCardHover: {
        transform: "translateY(-3px)",
    },
    statIcon: {
        fontSize: "2rem",
        marginBottom: "0.5rem",
    },
    statNumber: {
        fontSize: "2rem",
        fontWeight: "bold",
        color: "#3498db",
        marginBottom: "0.25rem",
    },
    statLabel: {
        color: "#7f8c8d",
        fontSize: "0.9rem",
    },
    actionsSection: {
        marginBottom: "2rem",
    },
    actionsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1rem",
    },
    actionCard: {
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        transition: "transform 0.2s",
        cursor: "pointer",
    },
    actionCardHover: {
        transform: "translateY(-3px)",
    },
    actionIcon: {
        fontSize: "2.5rem",
        marginBottom: "1rem",
    },
    activitySection: {
        marginBottom: "2rem",
    },
    activityPlaceholder: {
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    activityList: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    activityItem: {
        display: "flex",
        alignItems: "flex-start",
        padding: "1rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        border: "1px solid #eee",
    },
    activityIcon: {
        fontSize: "1.5rem",
        marginRight: "1rem",
        color: "#3498db",
    },
    activityContent: {
        flex: 1,
    },
    activityTime: {
        fontSize: "0.8rem",
        color: "#7f8c8d",
        marginTop: "0.5rem",
    },
    activitySubtext: {
        color: "#95a5a6",
        fontSize: "0.9rem",
        marginTop: "0.5rem",
    },
    loading: {
        textAlign: "center",
        fontSize: "1.2rem",
        color: "#7f8c8d",
        padding: "2rem",
    },
};

export default WorkerHome;