/**
 * Navigation bar component
 * Shows different links based on user role and authentication status
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import api from "../api"; // Import the api instance

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation(); // Track current location
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleLogout = () => {
        // Clear all user data from localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("username");

        // Redirect to home page
        navigate("/");
    };

    // Handle window resize to update mobile view
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch unread notification count for authenticated users
    useEffect(() => {
        if (token && (role === "USER" || role === "WORKER" || role === "ADMIN")) {
            fetchUnreadCount();
            // Set up interval to refresh notification count
            const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
            return () => clearInterval(interval);
        }
    }, [token, role]);

    const fetchUnreadCount = () => {
        api.get("notifications/")
            .then((res) => {
                const notifications = res.data;
                const unread = notifications.filter(n => !n.is_read).length;
                setUnreadCount(unread);
            })
            .catch((err) => {
                console.error("Error fetching notifications:", err);
            });
    };

    // Styles for the navbar
    const styles = {
        navbar: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 2rem",
            backgroundColor: "#2c3e50",
            color: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            position: "sticky",
            top: "0",
            zIndex: "1000",
        },
        logo: {
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            color: "inherit",
        },
        logoText: {
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginLeft: "0.5rem",
        },
        navLinks: {
            display: "flex",
            gap: "2rem",
            alignItems: "center",
        },
        link: {
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1.25rem",
            borderRadius: "6px",
            transition: "background-color 0.3s ease",
        },
        activeLink: {
            backgroundColor: "#34495e",
            fontWeight: "bold",
        },
        mobileMenuButton: {
            display: "none",
            flexDirection: "column",
            background: "none",
            border: "none",
            color: "white",
            fontSize: "1.5rem",
            cursor: "pointer",
        },
        mobileMenu: {
            display: isMenuOpen ? "flex" : "none",
            flexDirection: "column",
            position: "absolute",
            top: "100%",
            left: "0",
            right: "0",
            backgroundColor: "#2c3e50",
            padding: "1rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            zIndex: "1001",
        },
        mobileLink: {
            color: "white",
            textDecoration: "none",
            padding: "0.75rem",
            marginBottom: "0.5rem",
            borderRadius: "6px",
            transition: "background-color 0.3s ease",
        },
        userSection: {
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
        },
        username: {
            color: "#ecf0f1",
            fontWeight: "bold",  /* Bold username */
            fontSize: "1rem",  /* Slightly larger font */
        },
        logoutBtn: {
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "background-color 0.3s ease",
        },
        notificationBadge: {
            position: "absolute",
            top: "-8px",
            right: "-8px",
            backgroundColor: "#e74c3c",
            color: "white",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.7rem",
            fontWeight: "bold",
        },
        roleIndicator: {
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(52, 152, 219, 0.1)",
            color: "#3498db",
            borderRadius: "4px",
            fontWeight: "500",
            alignSelf: "center",
            marginRight: "1rem",
        }
    };

    // Apply hover effect to links
    const linkStyle = (path) => ({
        ...styles.link,
        ...(location.pathname === path ? styles.activeLink : {})
    });

    return (
        <nav style={styles.navbar}>
            <Link
                to={token && role === "WORKER" ? "/worker-home" :
                    token && role === "ADMIN" ? "/admin-home" :
                        token && role === "USER" ? "/user-home" : "/"}
                style={styles.logo}
            >
                🏠
                <div style={styles.logoText}>Home Service Provider</div>
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
                <div style={styles.navLinks}>

                    {/* Only show these for non-admin users */}
                    {token && role !== "ADMIN" && (
                        <>
                            {role === "WORKER" && (
                                <>
                                    <Link to="/worker-dashboard#assigned-bookings" style={styles.link}>
                                        Your Assigned Bookings
                                    </Link>
                                    <Link to="/worker-dashboard#performance" style={styles.link}>
                                        Your Performance
                                    </Link>
                                    <Link to="/worker-dashboard#reviews" style={styles.link}>
                                        Customer Reviews
                                    </Link>
                                    <Link to="/earnings" style={linkStyle("/earnings")}>
                                        Earnings
                                    </Link>
                                    <Link to="/profile" style={linkStyle("/profile")}>
                                        Profile
                                    </Link>
                                    <Link to="/otp" style={linkStyle("/otp")}>
                                        Verify OTP
                                    </Link>
                                    <Link to="/notifications" style={{ ...linkStyle("/notifications"), position: "relative" }}>
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span style={styles.notificationBadge}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                    {username && (
                                        <span style={styles.roleIndicator}>
                                            {username}
                                        </span>
                                    )}
                                    <button onClick={handleLogout} style={styles.logoutBtn}>
                                        Logout
                                    </button>
                                </>
                            )}
                            {role === "USER" && (
                                <>
                                    <Link to="/user-home" style={linkStyle("/user-home")}>
                                        Home
                                    </Link>
                                    <Link to="/user-dashboard" style={linkStyle("/user-dashboard")}>
                                        Book Service
                                    </Link>
                                    <Link to="/booking-history" style={linkStyle("/booking-history")}>
                                        Booking History
                                    </Link>
                                    <Link to="/profile" style={linkStyle("/profile")}>
                                        Profile
                                    </Link>
                                    <Link to="/notifications" style={{ ...linkStyle("/notifications"), position: "relative" }}>
                                        Notifications
                                        {unreadCount > 0 && (
                                            <span style={styles.notificationBadge}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                    <button onClick={handleLogout} style={styles.logoutBtn}>
                                        Logout
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {/* Admin navigation */}
                    {token && role === "ADMIN" && (
                        <>
                            <Link to="/admin-home" style={linkStyle("/admin-home")}>
                                Dashboard
                            </Link>
                            <Link to="/admin-dashboard?tab=workers" style={linkStyle("/admin-dashboard?tab=workers")}>
                                Workers
                            </Link>
                            <Link to="/admin-dashboard?tab=users" style={linkStyle("/admin-dashboard?tab=users")}>
                                Users
                            </Link>
                            <Link to="/admin-dashboard?tab=bookings" style={linkStyle("/admin-dashboard?tab=bookings")}>
                                Bookings
                            </Link>
                            <Link to="/admin-dashboard?tab=services" style={linkStyle("/admin-dashboard?tab=services")}>
                                Services
                            </Link>
                            <Link to="/admin-dashboard?tab=ratings" style={linkStyle("/admin-dashboard?tab=ratings")}>
                                Ratings & Reviews
                            </Link>
                            <Link to="/admin-dashboard?tab=payments" style={linkStyle("/admin-dashboard?tab=payments")}>
                                Payments
                            </Link>
                            <Link to="/notifications" style={{ ...linkStyle("/notifications"), position: "relative" }}>
                                Notifications
                                {unreadCount > 0 && (
                                    <span style={styles.notificationBadge}>
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                            <button onClick={handleLogout} style={styles.logoutBtn}>
                                Logout
                            </button>
                        </>
                    )}

                    {/* Guest navigation */}
                    {!token && (
                        <>
                            <Link to="/" style={linkStyle("/")}>
                                Home
                            </Link>
                            <Link to="/login" style={linkStyle("/login")}>
                                Login
                            </Link>
                            <Link to="/register" style={linkStyle("/register")}>
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
                <button
                    style={styles.mobileMenuButton}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    ☰
                </button>
            )}



            {/* Mobile Menu */}
            {isMobile && (
                <div style={styles.mobileMenu}>

                    {/* Only show these for non-admin users */}
                    {token && role !== "ADMIN" && (
                        <>
                            {role === "WORKER" && (
                                <>
                                    <Link
                                        to="/worker-dashboard#assigned-bookings"
                                        style={styles.mobileLink}
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setTimeout(() => {
                                                document.getElementById('assigned-bookings')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                    >
                                        Your Assigned Bookings
                                    </Link>
                                    <Link
                                        to="/worker-dashboard#performance"
                                        style={styles.mobileLink}
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setTimeout(() => {
                                                document.getElementById('performance')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                    >
                                        Your Performance
                                    </Link>
                                    <Link
                                        to="/worker-dashboard#reviews"
                                        style={styles.mobileLink}
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setTimeout(() => {
                                                document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
                                            }, 100);
                                        }}
                                    >
                                        Customer Reviews
                                    </Link>
                                    <Link
                                        to="/earnings"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Earnings
                                    </Link>
                                    <Link
                                        to="/profile"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/otp"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Verify OTP
                                    </Link>
                                    <Link
                                        to="/notifications"
                                        style={{ ...styles.mobileLink, position: "relative" }}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        style={styles.logoutBtn}
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                            {role === "USER" && (
                                <>
                                    <Link
                                        to="/user-home"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        to="/user-dashboard"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Book Service
                                    </Link>
                                    <Link
                                        to="/booking-history"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Booking History
                                    </Link>
                                    <Link
                                        to="/profile"
                                        style={styles.mobileLink}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/notifications"
                                        style={{ ...styles.mobileLink, position: "relative" }}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Notifications {unreadCount > 0 && `(${unreadCount})`}
                                    </Link>
                                    <button
                                        onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                        style={styles.logoutBtn}
                                    >
                                        Logout
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {/* Admin navigation */}
                    {token && role === "ADMIN" && (
                        <>
                            <Link
                                to="/admin-home"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/admin-dashboard?tab=workers"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Workers
                            </Link>
                            <Link
                                to="/admin-dashboard?tab=users"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Users
                            </Link>
                            <Link
                                to="/admin-dashboard?tab=bookings"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Bookings
                            </Link>
                            <Link
                                to="/admin-dashboard?tab=services"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Services
                            </Link>
                            <Link
                                to="/admin-dashboard?tab=ratings"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Ratings & Reviews
                            </Link>
                            <Link
                                to="/admin-dashboard?tab=payments"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Payments
                            </Link>
                            <Link
                                to="/notifications"
                                style={{ ...styles.mobileLink, position: "relative" }}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Notifications {unreadCount > 0 && `(${unreadCount})`}
                            </Link>
                            <button
                                onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                style={styles.logoutBtn}
                            >
                                Logout
                            </button>
                        </>
                    )}

                    {/* Guest navigation */}
                    {!token && (
                        <>
                            <Link
                                to="/"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Home
                            </Link>
                            <Link
                                to="/login"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                style={styles.mobileLink}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}

export default Navbar;
