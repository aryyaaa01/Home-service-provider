/**
 * Home Page Component
 * Main landing page for the Home Service Provider application
 */
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";

function Home() {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        // Fetch all available services
        api.get("services/")
            .then((res) => {
                setServices(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching services:", err);
                setLoading(false);
            });
    }, []);

    // Function to get service icon based on service name
    const getServiceIcon = (serviceName) => {
        const name = serviceName.toLowerCase();
        if (name.includes("electric") || name.includes("electrical")) return "⚡";
        if (name.includes("plumb") || name.includes("pipe")) return "🔧";
        if (name.includes("ac") || name.includes("air")) return "❄️";
        if (name.includes("paint")) return "🎨";
        if (name.includes("carpenter")) return "🪚";
        if (name.includes("clean")) return "🧼";
        return "🏠"; // Default house icon
    };

    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>Welcome to Home Service Provider</h1>
                <p style={styles.heroSubtitle}>
                    Book professional home services like Electrician, Plumber, and more!
                </p>
            </div>

            <div style={styles.servicesSection}>
                <h2 style={styles.sectionTitle}>Available Services</h2>

                {loading ? (
                    <p style={styles.loadingText}>Loading services...</p>
                ) : services.length === 0 ? (
                    <p style={styles.noServicesText}>No services available at the moment.</p>
                ) : (
                    <div style={styles.servicesGrid}>
                        {services.map((service) => (
                            <div key={service.id} style={styles.serviceCard}>
                                <div style={styles.serviceIcon}>
                                    {getServiceIcon(service.name)}
                                </div>
                                <h3 style={styles.serviceName}>{service.name}</h3>
                                <p style={styles.serviceDescription}>{service.description}</p>

                                {service.price && (
                                    <div style={styles.servicePrice}>
                                        Price: ₹{service.price}
                                    </div>
                                )}

                                {service.estimated_duration && (
                                    <div style={styles.serviceDuration}>
                                        Duration: {service.estimated_duration}
                                    </div>
                                )}

                                <div style={styles.serviceRating}>
                                    ⭐ {(service.average_rating || 0) > 0 ? parseFloat(service.average_rating).toFixed(1) : 'No ratings'} ({(service.average_rating || 0) > 0 ? 'Based on reviews' : 'No reviews'})
                                </div>

                                <button
                                    style={styles.bookServiceBtn}
                                    onClick={() => {
                                        // Navigate to service details page
                                        navigate(`/service/${service.id}`);
                                    }}
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
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

    servicesSection: {
        marginTop: "2rem",
    },
    sectionTitle: {
        fontSize: "2rem",
        color: "#2c3e50",
        textAlign: "center",
        marginBottom: "2rem",
    },
    servicesGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "2rem",
    },
    serviceCard: {
        backgroundColor: "rgba(255, 255, 255, 0.85)", // Semi-transparent background
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        transition: "transform 0.3s",
    },
    serviceCardHover: {
        transform: "translateY(-5px)",
    },
    serviceIcon: {
        fontSize: "3rem",
        marginBottom: "1rem",
    },
    serviceName: {
        fontSize: "1.5rem",
        color: "#2c3e50",
        marginBottom: "0.5rem",
    },
    serviceDescription: {
        color: "#7f8c8d",
        marginBottom: "1rem",
        minHeight: "60px",
    },
    servicePrice: {
        fontWeight: "500",
        color: "#27ae60",
        marginBottom: "0.5rem",
    },
    serviceDuration: {
        color: "#f39c12",
        marginBottom: "0.5rem",
    },
    serviceRating: {
        color: "#f1c40f",
        marginBottom: "1rem",
        fontWeight: "500",
    },
    bookServiceBtn: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        width: "100%",
    },
    loadingText: {
        textAlign: "center",
        fontSize: "1.2rem",
        color: "#7f8c8d",
    },
    noServicesText: {
        textAlign: "center",
        fontSize: "1.2rem",
        color: "#e74c3c",
    },
};

export default Home;