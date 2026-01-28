/**
 * User Home Page Component
 * Specific home page for users after login
 */
import React from "react";
import { Link } from "react-router-dom";

function UserHome() {
    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>Welcome, User!</h1>
                <p style={styles.heroSubtitle}>
                    Manage your home service requests and bookings
                </p>
            </div>

            <div style={styles.featuresSection}>
                <h2 style={styles.sectionTitle}>Quick Actions</h2>
                <div style={styles.featuresGrid}>
                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>🏠</div>
                        <h3 style={styles.featureTitle}>Browse Services</h3>
                        <p style={styles.featureDescription}>
                            Explore all available home services and find professionals for your needs
                        </p>
                        <Link to="/" style={styles.featureButton}>
                            Browse Services
                        </Link>
                    </div>

                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>📋</div>
                        <h3 style={styles.featureTitle}>My Bookings</h3>
                        <p style={styles.featureDescription}>
                            View and manage your service bookings and appointments
                        </p>
                        <Link to="/user-dashboard" style={styles.featureButton}>
                            My Bookings
                        </Link>
                    </div>

                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>⭐</div>
                        <h3 style={styles.featureTitle}>Rate Services</h3>
                        <p style={styles.featureDescription}>
                            Share your experience and rate the services you've received
                        </p>
                        <Link to="/user-dashboard" style={styles.featureButton}>
                            Rate Services
                        </Link>
                    </div>

                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>🔔</div>
                        <h3 style={styles.featureTitle}>Notifications</h3>
                        <p style={styles.featureDescription}>
                            Stay updated with booking status and service notifications
                        </p>
                        <Link to="/notifications" style={styles.featureButton}>
                            View Notifications
                        </Link>
                    </div>
                </div>
            </div>

            <div style={styles.servicesSection}>
                <h2 style={styles.sectionTitle}>Popular Services</h2>
                <p style={styles.sectionDescription}>
                    Find trusted professionals for common home services
                </p>
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
    hero: {
        textAlign: "center",
        marginBottom: "3rem",
        backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent background
        padding: "2rem",
        borderRadius: "10px",
    },
    heroTitle: {
        fontSize: "2.5rem",
        color: "#2c3e50",
        marginBottom: "1rem",
    },
    heroSubtitle: {
        fontSize: "1.2rem",
        color: "#34495e",
        marginBottom: "2rem",
    },
    featuresSection: {
        marginTop: "2rem",
        marginBottom: "3rem",
    },
    sectionTitle: {
        fontSize: "2rem",
        color: "#2c3e50",
        textAlign: "center",
        marginBottom: "2rem",
    },
    sectionDescription: {
        textAlign: "center",
        color: "#7f8c8d",
        marginBottom: "2rem",
        fontSize: "1.1rem",
    },
    featuresGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "2rem",
    },
    featureCard: {
        backgroundColor: "rgba(255, 255, 255, 0.85)", // Semi-transparent background
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        transition: "transform 0.3s",
    },
    featureCardHover: {
        transform: "translateY(-5px)",
    },
    featureIcon: {
        fontSize: "3rem",
        marginBottom: "1rem",
    },
    featureTitle: {
        fontSize: "1.5rem",
        color: "#2c3e50",
        marginBottom: "0.5rem",
    },
    featureDescription: {
        color: "#7f8c8d",
        marginBottom: "1rem",
        minHeight: "60px",
    },
    featureButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#3498db",
        color: "white",
        textDecoration: "none",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        display: "inline-block",
        width: "100%",
        maxWidth: "200px",
    },
    servicesSection: {
        marginTop: "2rem",
    },
};

export default UserHome;