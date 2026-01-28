/**
 * Rating Display Component
 * Shows all ratings and reviews for a service
 */
import React from "react";

function RatingDisplay({ ratings, title }) {
    if (!ratings || ratings.length === 0) {
        return (
            <div style={styles.noRatings}>
                <p>No reviews yet. Be the first to review!</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>{title || "Reviews"}</h3>
            <div style={styles.ratingsList}>
                {ratings.map((rating) => (
                    <div key={rating.id} style={styles.ratingCard}>
                        <div style={styles.ratingHeader}>
                            <div style={styles.userInfo}>
                                <strong>By {rating.user_username}</strong>
                            </div>
                            <div style={styles.starsContainer}>
                                {[...Array(5)].map((_, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            color: i < rating.rating ? "#f39c12" : "#bdc3c7",
                                            fontSize: "1.2rem"
                                        }}
                                    >
                                        ★
                                    </span>
                                ))}
                                <span style={styles.ratingValue}> {rating.rating}/5</span>
                            </div>
                        </div>
                        {rating.review && (
                            <div style={styles.reviewText}>
                                "{rating.review}"
                            </div>
                        )}
                        <div style={styles.date}>
                            {new Date(rating.created_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: "100%",
    },
    title: {
        fontSize: "1.3rem",
        color: "#2c3e50",
        marginBottom: "1rem",
    },
    noRatings: {
        textAlign: "center",
        padding: "2rem",
        color: "#7f8c8d",
        fontStyle: "italic",
    },
    ratingsList: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    ratingCard: {
        backgroundColor: "#f8f9fa",
        padding: "1.2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        border: "1px solid #e9ecef",
    },
    ratingHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "0.5rem",
        flexWrap: "wrap",
        gap: "0.5rem",
    },
    userInfo: {
        flex: 1,
        fontWeight: "500",
        color: "#2c3e50",
    },
    starsContainer: {
        display: "flex",
        alignItems: "center",
        gap: "0.2rem",
    },
    ratingValue: {
        marginLeft: "0.5rem",
        fontWeight: "500",
        color: "#2c3e50",
    },
    reviewText: {
        marginBottom: "0.5rem",
        color: "#34495e",
        fontStyle: "normal",
        lineHeight: "1.5",
        padding: "0.5rem",
        backgroundColor: "#ffffff",
        borderRadius: "4px",
        borderLeft: "3px solid #3498db",
    },
    date: {
        fontSize: "0.8rem",
        color: "#7f8c8d",
        textAlign: "right",
        marginTop: "0.5rem",
    },
};

export default RatingDisplay;