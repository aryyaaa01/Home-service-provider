/**
 * Login Component
 * Handles user authentication and redirects based on user role
 */
import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

function Login() {
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const errorTimeoutRef = useRef(null);

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await api.post("login/", credentials);

            // Clear any existing error timeout
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = null;
            }

            // Save token and user info to localStorage
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("role", response.data.user.role);
            localStorage.setItem("username", response.data.user.username);

            // Redirect based on user role
            switch (response.data.user.role) {
                case "USER":
                    navigate("/user-home");
                    break;
                case "WORKER":
                    navigate("/worker-home");
                    break;
                case "ADMIN":
                    navigate("/admin-home");
                    break;
                default:
                    setError("Unknown user role");
            }
        } catch (err) {
            console.error("Login error:", err);

            // Clear any existing error timeout
            if (errorTimeoutRef.current) {
                clearTimeout(errorTimeoutRef.current);
                errorTimeoutRef.current = null;
            }

            // Handle specific error messages from the backend
            let errorMsg;
            let rawErrorMsg = err.response?.data?.error || err.response?.data?.non_field_errors?.[0];

            // Only show approval-related errors to workers
            if (rawErrorMsg && (rawErrorMsg.toLowerCase().includes('approval') || rawErrorMsg.toLowerCase().includes('approved'))) {
                errorMsg = rawErrorMsg;
            } else {
                // For other login failures, show generic message
                errorMsg = "Login failed. Please check your credentials and try again.";
            }

            // Set the error message
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.loginBox}>
                <h2 style={styles.title}>Login</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Username:</label>
                        <input
                            type="text"
                            name="username"
                            value={credentials.username}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div style={styles.registerLink}>
                    Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
        padding: "2rem",
    },
    loginBox: {
        backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent background
        padding: "2rem",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    title: {
        textAlign: "center",
        marginBottom: "1.5rem",
        color: "#2c3e50",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
    },
    label: {
        marginBottom: "0.5rem",
        fontWeight: "500",
        color: "#34495e",
    },
    input: {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
    },
    button: {
        padding: "0.75rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        cursor: "pointer",
    },
    error: {
        padding: "0.75rem",
        backgroundColor: "#fadbd8",
        color: "#c0392b",
        borderRadius: "4px",
        marginBottom: "1rem",
    },
    registerLink: {
        textAlign: "center",
        marginTop: "1rem",
        color: "#7f8c8d",
    },
    link: {
        color: "#3498db",
        textDecoration: "none",
    },
};

export default Login;