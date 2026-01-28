/**
 * Admin Home Page Component
 * Post-login home page for administrators with platform management focus
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function AdminHome() {
    const [adminInfo, setAdminInfo] = useState(null);
    const [stats, setStats] = useState({});
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch admin profile and platform stats
        Promise.all([
            api.get("profile/"),
            api.get("admin/bookings/"),
            api.get("admin/workers/"),
            api.get("users/")
        ])
            .then(([profileRes, bookingsRes, workersRes, usersRes]) => {
                setAdminInfo(profileRes.data);

                // Calculate platform stats
                const bookings = bookingsRes.data;
                const workers = workersRes.data;
                const users = usersRes.data;

                const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;
                const assignedBookings = bookings.filter(b => b.status === 'ASSIGNED').length;
                const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
                const approvedWorkers = workers.filter(w => w.is_approved).length;

                setStats({
                    totalBookings: bookings.length,
                    pendingBookings,
                    assignedBookings,
                    completedBookings,
                    totalWorkers: workers.length,
                    approvedWorkers,
                    totalUsers: users.length
                });

                // Generate recent activity feed
                const activityFeed = [];

                // Add recent bookings (last 5)
                const recentBookings = [...bookings]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 5);

                recentBookings.forEach(booking => {
                    activityFeed.push({
                        id: `booking-${booking.id}`,
                        type: 'booking',
                        title: `New Booking #${booking.id}`,
                        description: `${booking.user_username} booked ${booking.service_name}`,
                        user: booking.user_username,
                        service: booking.service_name,
                        worker: booking.worker_username,
                        status: booking.status,
                        timestamp: booking.created_at,
                        icon: '📋',
                        color: '#3498db'
                    });
                });

                // Add recent worker approvals (last 3)
                const recentWorkers = [...workers]
                    .filter(w => w.is_approved)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 3);

                recentWorkers.forEach(worker => {
                    activityFeed.push({
                        id: `worker-${worker.id}`,
                        type: 'worker',
                        title: `Worker Approved`,
                        description: `${worker.username} has been approved as a service provider`,
                        user: worker.username,
                        specialty: worker.specialty,
                        timestamp: worker.created_at,
                        icon: '✅',
                        color: '#27ae60'
                    });
                });

                // Note: System events can be added here when actual system logging is implemented

                // Sort all activities by timestamp (newest first)
                activityFeed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setRecentActivity(activityFeed);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading admin data:", err);
                setLoading(false);
            });
    }, []);

    // Helper function to format relative time
    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return time.toLocaleDateString();
    };

    // Helper function to get status color
    const getStatusColor = (status) => {
        const colors = {
            'PENDING': '#f39c12',
            'ASSIGNED': '#3498db',
            'IN_PROGRESS': '#9b59b6',
            'COMPLETED': '#27ae60',
            'CANCELLED': '#e74c3c'
        };
        return colors[status] || '#95a5a6';
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading admin dashboard...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.welcome}>Welcome, <strong>ADMIN </strong>{adminInfo?.username}!</h1>
                    <p style={styles.subtitle}>Platform Management Dashboard</p>
                </div>
            </div>

            {/* Platform Stats */}
            <div style={styles.statsSection}>
                <h2 style={styles.sectionTitle}>Platform Statistics</h2>
                <div style={styles.statsGrid}>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.statIcon}>📋</div>
                        <div style={styles.statNumber}>{stats.totalBookings}</div>
                        <div style={styles.statLabel}>Total Bookings</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.statIcon}>⏳</div>
                        <div style={styles.statNumber}>{stats.pendingBookings}</div>
                        <div style={styles.statLabel}>Pending Bookings</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.statIcon}>✅</div>
                        <div style={styles.statNumber}>{stats.completedBookings}</div>
                        <div style={styles.statLabel}>Completed</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=users')} className="clickable">
                        <div style={styles.statIcon}>👥</div>
                        <div style={styles.statNumber}>{stats.totalUsers}</div>
                        <div style={styles.statLabel}>Registered Users</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=workers')} className="clickable">
                        <div style={styles.statIcon}>👷</div>
                        <div style={styles.statNumber}>{stats.totalWorkers}</div>
                        <div style={styles.statLabel}>Total Workers</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=workers')} className="clickable">
                        <div style={styles.statIcon}>👍</div>
                        <div style={styles.statNumber}>{stats.approvedWorkers}</div>
                        <div style={styles.statLabel}>Approved Workers</div>
                    </div>
                </div>
            </div>

            {/* Management Sections */}
            <div style={styles.managementSection}>
                <h2 style={styles.sectionTitle}>Management Tools</h2>
                <div style={styles.managementGrid}>
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.managementIcon}>📋</div>
                        <h3>Booking Management</h3>
                        <p>Assign workers, monitor bookings, and manage schedules</p>
                        <div style={styles.cardBadge}>
                            {stats.pendingBookings} pending
                        </div>
                    </div>
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=workers')} className="clickable">
                        <div style={styles.managementIcon}>👷</div>
                        <h3>Worker Management</h3>
                        <p>Approve new workers and manage service providers</p>
                        <div style={styles.cardBadge}>
                            {stats.totalWorkers - stats.approvedWorkers} pending approval
                        </div>
                    </div>
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=services')} className="clickable">
                        <div style={styles.managementIcon}>⚙️</div>
                        <h3>Service Management</h3>
                        <p>Add, edit, or remove service offerings</p>
                    </div>
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=payments')} className="clickable">
                        <div style={styles.managementIcon}>📊</div>
                        <h3>Analytics & Reports</h3>
                        <p>View platform performance and generate reports</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={styles.activitySection}>
                <h2 style={styles.sectionTitle}>Recent Platform Activity</h2>
                <div style={styles.activityContainer}>
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity, index) => (
                            <div key={activity.id} style={styles.activityItem}>
                                <div style={{ ...styles.activityIcon, backgroundColor: activity.color }}>
                                    {activity.icon}
                                </div>
                                <div style={styles.activityContent}>
                                    <div style={styles.activityHeader}>
                                        <h3 style={styles.activityTitle}>{activity.title}</h3>
                                        <span style={styles.activityTime}>
                                            {formatRelativeTime(activity.timestamp)}
                                        </span>
                                    </div>
                                    <p style={styles.activityDescription}>{activity.description}</p>
                                    {activity.type === 'booking' && (
                                        <div style={styles.activityMeta}>
                                            <span style={{ ...styles.metaTag, backgroundColor: getStatusColor(activity.status) }}>
                                                {activity.status}
                                            </span>
                                            {activity.worker && (
                                                <span style={styles.metaTag}>
                                                    👷 {activity.worker}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {activity.type === 'worker' && activity.specialty && (
                                        <div style={styles.activityMeta}>
                                            <span style={styles.metaTag}>
                                                🔧 {activity.specialty}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={styles.noActivity}>
                            <p>📋 No recent activity to display</p>
                            <p style={styles.activitySubtext}>Platform events will appear here as they occur</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
        minHeight: "100vh",
        backgroundImage: "url('https://images.unsplash.com/photo-1517245386807-bb74b8a3c61e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
    },
    welcome: {
        fontSize: "2rem",
        color: "#2c3e50",
        margin: "0 0 0.5rem 0",
        fontWeight: "600",
    },
    subtitle: {
        fontSize: "1.1rem",
        color: "#7f8c8d",
        margin: "0",
    },
    statsSection: {
        marginBottom: "2rem",
    },
    sectionTitle: {
        fontSize: "1.5rem",
        color: "#2c3e50",
        marginBottom: "1rem",
        fontWeight: "600",
    },
    statsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "1rem",
    },
    statCard: {
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        padding: "1.5rem",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        border: "1px solid #e9ecef",
    },
    statCardHover: {
        transform: "translateY(-3px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    },
    statIcon: {
        fontSize: "2rem",
        marginBottom: "0.5rem",
        color: "#4a6cf7",
    },
    statNumber: {
        fontSize: "1.8rem",
        fontWeight: "bold",
        color: "#2c3e50",
        marginBottom: "0.25rem",
    },
    statLabel: {
        color: "#7f8c8d",
        fontSize: "0.9rem",
    },
    managementSection: {
        marginBottom: "2rem",
    },
    managementGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1rem",
    },
    managementCard: {
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        textDecoration: "none",
        color: "inherit",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        position: "relative",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        cursor: "pointer",
        border: "1px solid #e9ecef",
    },
    managementCardHover: {
        transform: "translateY(-3px)",
        boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    },
    managementIcon: {
        fontSize: "2.5rem",
        marginBottom: "1rem",
        color: "#4a6cf7",
    },
    cardBadge: {
        position: "absolute",
        top: "1rem",
        right: "1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        padding: "0.25rem 0.75rem",
        borderRadius: "12px",
        fontSize: "0.8rem",
        fontWeight: "500",
    },
    activitySection: {
        marginBottom: "2rem",
    },
    activityContainer: {
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        border: "1px solid #e9ecef",
    },
    activityItem: {
        display: "flex",
        padding: "1.25rem",
        borderBottom: "1px solid #ecf0f1",
    },
    activityIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
        minWidth: "40px",
        marginRight: "1rem",
        color: "white",
    },
    activityContent: {
        flex: 1,
    },
    activityHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.5rem",
    },
    activityTitle: {
        fontSize: "1.1rem",
        fontWeight: "600",
        color: "#2c3e50",
        margin: "0",
    },
    activityTime: {
        fontSize: "0.85rem",
        color: "#95a5a6",
        whiteSpace: "nowrap",
    },
    activityDescription: {
        color: "#7f8c8d",
        margin: "0 0 0.75rem 0",
        lineHeight: "1.4",
    },
    activityMeta: {
        display: "flex",
        gap: "0.5rem",
        flexWrap: "wrap",
    },
    metaTag: {
        backgroundColor: "#ecf0f1",
        color: "#2c3e50",
        padding: "0.25rem 0.75rem",
        borderRadius: "12px",
        fontSize: "0.8rem",
        fontWeight: "500",
    },
    noActivity: {
        padding: "2rem",
        textAlign: "center",
        color: "#7f8c8d",
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

export default AdminHome;