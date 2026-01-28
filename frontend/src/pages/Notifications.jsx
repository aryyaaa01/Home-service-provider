import React, { useState, useEffect } from 'react';
import api from '../api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all messages

    useEffect(() => {
        fetchNotifications();
        // Mark all notifications as read when visiting the notifications page
        markAllAsRead();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications/');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Fetch all notifications and mark each as read
            const response = await api.get('/notifications/');
            const allNotifications = response.data;

            // Mark each notification as read
            for (const notification of allNotifications) {
                if (!notification.is_read) {
                    await api.post(`/notifications/${notification.id}/mark-read/`);
                }
            }

            // Refresh the notifications list
            fetchNotifications();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        return true; // Show all notifications
    });

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'BOOKING_STATUS': return '📋';
            case 'ASSIGNMENT': return '👤';
            case 'OTP': return '🔢';
            case 'PAYMENT': return '💳';
            case 'SYSTEM': return '⚙️';
            case 'BOOKING_REJECTION': return '❌';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'BOOKING_STATUS': return '#3498db';
            case 'ASSIGNMENT': return '#9b59b6';
            case 'OTP': return '#f39c12';
            case 'PAYMENT': return '#27ae60';
            case 'SYSTEM': return '#e74c3c';
            case 'BOOKING_REJECTION': return '#e74c3c';
            default: return '#7f8c8d';
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>
                    <div style={styles.spinner}></div>
                    Loading notifications...
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h1 style={styles.pageTitle}>🔔 All Notifications</h1>
                    <p style={styles.subtitle}>
                        Showing all notifications
                    </p>
                </div>
            </div>

            {/* All notifications shown - no filters needed */}

            <div style={styles.notificationsContainer}>
                {filteredNotifications.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>📭</div>
                        <h3>No notifications found</h3>
                        <p>
                            {filter === 'unread'
                                ? "You're all caught up! No unread notifications."
                                : "There are no notifications matching your current filter."
                            }
                        </p>
                    </div>
                ) : (
                    <div style={styles.notificationsList}>
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                style={styles.notificationCard}
                            >
                                <div style={styles.notificationHeader}>
                                    <div style={{
                                        ...styles.notificationIcon,
                                        backgroundColor: getNotificationColor(notification.notification_type)
                                    }}>
                                        {getNotificationIcon(notification.notification_type)}
                                    </div>
                                    <div style={styles.notificationInfo}>
                                        <h3 style={styles.notificationTitle}>{notification.title}</h3>
                                        <p style={styles.notificationTime}>
                                            {new Date(notification.created_at).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div style={styles.notificationBody}>
                                    <p style={styles.notificationMessage}>{notification.message}</p>
                                </div>

                                <div style={styles.notificationType}>
                                    <span style={{
                                        ...styles.typeBadge,
                                        backgroundColor: getNotificationColor(notification.notification_type)
                                    }}>
                                        {notification.notification_type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '2rem',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    pageTitle: {
        fontSize: '2rem',
        color: '#2c3e50',
        margin: '0 0 0.5rem 0',
        fontWeight: '700',
    },
    subtitle: {
        fontSize: '1.1rem',
        color: '#7f8c8d',
        margin: 0,
    },

    /* Filters section removed - no longer used */
    notificationsContainer: {
        minHeight: '400px',
        marginTop: '2rem',
    },
    notificationsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    notificationCard: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        border: '1px solid #e1e8ed',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    notificationHeader: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1rem',
    },
    notificationIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        color: 'white',
        flexShrink: 0,
    },
    notificationInfo: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: '1.3rem',
        color: '#2c3e50',
        margin: '0 0 0.5rem 0',
        fontWeight: '600',
    },
    notificationTime: {
        fontSize: '0.9rem',
        color: '#7f8c8d',
        margin: 0,
    },
    notificationBody: {
        marginBottom: '1rem',
        paddingLeft: '60px',
    },
    notificationMessage: {
        fontSize: '1.1rem',
        color: '#34495e',
        lineHeight: '1.6',
        margin: 0,
    },
    notificationType: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: '60px',
    },
    typeBadge: {
        padding: '0.4rem 1rem',
        borderRadius: '20px',
        color: 'white',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    emptyState: {
        textAlign: 'center',
        padding: '4rem 2rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    emptyIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
        opacity: '0.5',
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '1rem',
    },
};

export default Notifications;