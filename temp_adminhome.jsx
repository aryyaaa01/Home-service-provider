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
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading admin data:", err);
                setLoading(false);
            });
    }, []);

    const handleLogout = () => {
        api.post("logout/")
            .then(() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("username");
                navigate("/");
            })
            .catch(err => {
                console.error("Logout error:", err);
            });
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
                    <h1 style={styles.welcome}>Welcome, Admin {adminInfo?.username}!</h1>
                    <p style={styles.subtitle}>Platform Management Dashboard</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Logout
                    </button>
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
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.statIcon}>👥</div>
                        <div style={styles.statNumber}>{stats.totalUsers}</div>
                        <div style={styles.statLabel}>Registered Users</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.statIcon}>👷</div>
                        <div style={styles.statNumber}>{stats.totalWorkers}</div>
                        <div style={styles.statLabel}>Total Workers</div>
                    </div>
                    <div style={styles.statCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
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
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.managementIcon}>👷</div>
                        <h3>Worker Management</h3>
                        <p>Approve new workers and manage service providers</p>
                        <div style={styles.cardBadge}>
                            {stats.totalWorkers - stats.approvedWorkers} pending approval
                        </div>
                    </div>
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.managementIcon}>⚙️</div>
                        <h3>Service Management</h3>
                        <p>Add, edit, or remove service offerings</p>
                    </div>
                    <div style={styles.managementCard} onClick={() => navigate('/admin-dashboard?tab=bookings')} className="clickable">
                        <div style={styles.managementIcon}>📊</div>
                        <h3>Analytics & Reports</h3>
                        <p>View platform performance and generate reports</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={styles.activitySection}>
                <h2 style={styles.sectionTitle}>Recent Platform Activity</h2>
                <div style={styles.activityPlaceholder}>
                    <p>📈 Platform activity monitoring coming soon</p>
                    <p style={styles.activitySubtext}>Recent bookings, worker approvals, and system events will be displayed here</p>
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
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        backgroundColor: "rgba(155, 89, 182, 0.1)",
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
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
        fontSize: "1.8rem",
        fontWeight: "bold",
        color: "#9b59b6",
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
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        position: "relative",
        transition: "transform 0.2s",
        cursor: "pointer",
    },
    managementCardHover: {
        transform: "translateY(-3px)",
    },
    managementIcon: {
        fontSize: "2.5rem",
        marginBottom: "1rem",
    },
    cardBadge: {
        position: "absolute",
        top: "1rem",
        right: "1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        padding: "0.25rem 0.5rem",
        borderRadius: "12px",
        fontSize: "0.8rem",
        fontWeight: "500",
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