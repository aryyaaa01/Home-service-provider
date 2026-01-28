/**
 * Service Details Component
 * Displays detailed information about a specific service
 */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import api from "../api";
import RatingDisplay from "../components/RatingDisplay.jsx";

function ServiceDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [service, setService] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Get the specific service details
                const serviceResponse = await api.get(`service-details/${id}/`);

                if (serviceResponse.data.error) {
                    setError(serviceResponse.data.error);
                    setLoading(false);
                    return;
                }

                setService(serviceResponse.data);

                // Get ratings for this service
                const ratingsResponse = await api.get(`services/${id}/ratings/`);
                setRatings(ratingsResponse.data);
            } catch (err) {
                console.error("Error fetching service details:", err);
                setError("Failed to load service details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div style={styles.container}>
                <p>Loading service details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.container}>
                <p style={styles.error}>{error}</p>
            </div>
        );
    }

    if (!service) {
        return (
            <div style={styles.container}>
                <p>Service not found.</p>
            </div>
        );
    }

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
            <div style={styles.serviceDetailCard}>
                <div style={styles.header}>
                    <button
                        onClick={() => navigate(-1)}
                        style={styles.backButton}
                        aria-label="Go back"
                    >
                        ← Back
                    </button>
                    <div style={styles.icon}>{getServiceIcon(service.name)}</div>
                    <h1 style={styles.title}>{service.name}</h1>
                </div>

                <div style={styles.infoSection}>
                    <h2 style={styles.sectionTitle}>Service Details</h2>
                    <div style={styles.detailsGrid}>
                        <div style={styles.detailItem}>
                            <strong>Description:</strong>
                            <span>{service.description || "No description available."}</span>
                        </div>

                        <div style={styles.detailItem}>
                            <strong>Price:</strong>
                            <span>{service.price ? `₹${service.price}` : "Price not set"}</span>
                        </div>

                        <div style={styles.detailItem}>
                            <strong>Duration:</strong>
                            <span>{service.estimated_duration ? service.estimated_duration : "Duration not specified"}</span>
                        </div>

                        <div style={styles.detailItem}>
                            <strong>Average Rating:</strong>
                            <div style={styles.ratingSection}>
                                <span style={styles.ratingValue}>
                                    {service.average_rating ? service.average_rating.toFixed(1) : 'No ratings'}
                                </span>
                                <div style={styles.starsContainer}>
                                    {[...Array(5)].map((_, i) => (
                                        <span
                                            key={i}
                                            style={{
                                                color: i < Math.floor(service.average_rating) ? "#f39c12" : "#bdc3c7",
                                                fontSize: "1.2rem"
                                            }}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span style={styles.totalReviews}>
                                    ({service.average_rating ? 'Based on reviews' : 'No reviews'})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={styles.infoSection}>
                    <h2 style={styles.sectionTitle}>What's Included</h2>
                    <ul style={styles.includedList}>
                        {(service.included_items && service.included_items.length > 0 ? service.included_items : [
                            "Professional service by certified technicians",
                            "Quality guarantee on work performed",
                            "Basic materials included",
                            "Clean-up after service completion"
                        ]).map((item, index) => (
                            <li key={index} style={styles.includedItem}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div style={styles.infoSection}>
                    <h2 style={styles.sectionTitle}>Customer Reviews</h2>
                    <RatingDisplay ratings={ratings} title="Service Reviews" />
                </div>

                <div style={styles.ctaSection}>
                    <button
                        style={styles.bookButton}
                        onClick={() => {
                            // Store the selected service in localStorage and redirect to login
                            localStorage.setItem('selectedService', JSON.stringify(service));
                            navigate('/login');
                        }}
                    >
                        Book This Service
                    </button>
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
    serviceDetailCard: {
        backgroundColor: "rgba(255, 255, 255, 0.85)", // Semi-transparent background
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    header: {
        textAlign: "center",
        marginBottom: "2rem",
    },
    icon: {
        fontSize: "4rem",
        marginBottom: "1rem",
    },
    title: {
        fontSize: "2.5rem",
        color: "#2c3e50",
        marginBottom: "0.5rem",
    },
    infoSection: {
        marginBottom: "2rem",
        padding: "1.5rem",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: "8px",
    },
    sectionTitle: {
        fontSize: "1.5rem",
        color: "#2c3e50",
        marginBottom: "1rem",
        borderBottom: "2px solid #3498db",
        paddingBottom: "0.5rem",
    },
    detailsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1rem",
    },
    detailItem: {
        marginBottom: "1rem",
    },
    ratingSection: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
    },
    ratingValue: {
        fontSize: "1.2rem",
        fontWeight: "bold",
        color: "#2c3e50",
    },
    starsContainer: {
        display: "flex",
        gap: "0.1rem",
    },
    totalReviews: {
        color: "#7f8c8d",
        fontSize: "0.9rem",
    },
    includedList: {
        listStyle: "none",
        padding: 0,
    },
    includedItem: {
        padding: "0.5rem 0",
        borderBottom: "1px solid #ecf0f1",
        position: "relative",
        paddingLeft: "1.5rem",
    },
    includedItemBefore: {
        content: '"•"',
        position: "absolute",
        left: "0",
    },
    ctaSection: {
        textAlign: "center",
        marginTop: "2rem",
        padding: "1.5rem",
        backgroundColor: "#e74c3c",
        borderRadius: "8px",
    },
    bookButton: {
        padding: "1rem 2rem",
        backgroundColor: "white",
        color: "#e74c3c",
        border: "none",
        borderRadius: "4px",
        fontSize: "1.2rem",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "background-color 0.3s",
    },
    bookButtonHover: {
        backgroundColor: "#ff6b6b",
    },
    backButton: {
        position: "absolute",
        top: "2rem",
        left: "2rem",
        padding: "0.5rem 1rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1rem",
        textDecoration: "none",
        zIndex: 100,
    },
    error: {
        color: "#e74c3c",
        textAlign: "center",
        fontSize: "1.2rem",
    },
};

export default ServiceDetails;