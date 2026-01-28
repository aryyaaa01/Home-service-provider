/**
 * Protected Route Component
 * Ensures only authenticated users with correct roles can access certain pages
 */
import React from "react";
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    // Check if user is authenticated
    if (!token) {
        // Not authenticated - redirect to login
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role(s)
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // User doesn't have required role - redirect to home or show error
        return (
            <div style={styles.container}>
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page.</p>
                <button
                    onClick={() => window.location.href = '/'}
                    style={styles.homeButton}
                >
                    Go to Home
                </button>
            </div>
        );
    }

    // User is authenticated and has required role - render child component
    return children;
}

const styles = {
    container: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "70vh",
        padding: "2rem",
    },
    homeButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginTop: "1rem",
    },
};

export default ProtectedRoute;