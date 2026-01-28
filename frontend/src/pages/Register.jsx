/**
 * Registration Component
 * Handles new user registration
 */
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import axios from "axios";

function Register() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "USER", // Default role
        phone_number: "",
        services: []  // Changed from single service to array for multiple services
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [services, setServices] = useState([]);

    useEffect(() => {
        if (formData.role === "WORKER") {
            // Fetch services for worker registration
            api.get("services/")
                .then(response => {
                    setServices(response.data);
                })
                .catch(error => {
                    console.error("Error fetching services:", error);
                });
        }
    }, [formData.role]);

    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'phone_number') {
            // Only allow numeric values and limit to 10 digits
            const numericValue = value.replace(/[^0-9]/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: numericValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleServiceChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedServiceIds = selectedOptions.map(option => parseInt(option.value));
        setFormData({ ...formData, services: selectedServiceIds });
    };

    const handleServiceCheckboxChange = (e, serviceId) => {
        const isChecked = e.target.checked;
        if (isChecked) {
            setFormData({
                ...formData,
                services: [...formData.services, serviceId]
            });
        } else {
            setFormData({
                ...formData,
                services: formData.services.filter(id => id !== serviceId)
            });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Validate required fields for workers
            if (formData.role === "WORKER") {
                if (!formData.services || formData.services.length === 0) {
                    setError("At least one service must be selected for workers");
                    setLoading(false);
                    return;
                }
            }

            // Prepare the data to send, handling the services array properly
            const registrationData = { ...formData };

            // For workers, we need to send the services as an array
            if (formData.role === "WORKER") {
                registrationData.service = formData.services;
            } else {
                // For non-workers, make sure service field is not sent
                delete registrationData.service;
            }

            const response = await api.post("register/", registrationData);

            // After successful registration, show success message and redirect to login
            alert("Registration successful! Your account needs admin approval before you can log in.");
            navigate("/login");
        } catch (err) {
            console.error("Registration error:", err);
            const errorMsg = err.response?.data || {};
            let errorMessage = "Registration failed. ";

            if (errorMsg.username) errorMessage += `Username: ${errorMsg.username.join(', ')}. `;
            if (errorMsg.email) errorMessage += `Email: ${errorMsg.email.join(', ')}. `;
            if (errorMsg.password) errorMessage += `Password: ${errorMsg.password.join(', ')}. `;
            if (errorMsg.phone_number) errorMessage += `Phone: ${errorMsg.phone_number.join(', ')}. `;
            if (errorMsg.non_field_errors) errorMessage += errorMsg.non_field_errors.join(', ');

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const phoneValid = !formData.phone_number || formData.phone_number.length === 10;
    const requiredFieldsFilled = formData.username && formData.email && formData.password && formData.phone_number && phoneValid && (formData.role !== "WORKER" || formData.services.length > 0);

    return (
        <div style={styles.container}>
            <div style={styles.registerBox}>
                <h2 style={styles.title}>Register</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleRegister} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Username:</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
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
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Phone Number:</label>
                        <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            required
                            style={formData.phone_number && formData.phone_number.length > 0 && formData.phone_number.length !== 10 ? { ...styles.input, borderColor: '#e74c3c' } : styles.input}
                        />
                    </div>



                    <div style={styles.formGroup}>
                        <label style={styles.label}>Role:</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            style={styles.select}
                        >
                            <option value="USER">User</option>
                            <option value="WORKER">Worker</option>
                        </select>
                    </div>



                    {formData.role === "WORKER" && services.length > 0 && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Services:</label>
                            <div style={styles.checkboxContainer}>
                                {services.map(service => (
                                    <label key={service.id} style={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            value={service.id}
                                            checked={formData.services.includes(service.id)}
                                            onChange={(e) => handleServiceCheckboxChange(e, service.id)}
                                            style={styles.checkboxInput}
                                        />
                                        {service.name}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {formData.role === "WORKER" && services.length === 0 && (
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Services:</label>
                            <p style={styles.noServicesText}>No services available. Contact admin to add services.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !requiredFieldsFilled}
                        style={requiredFieldsFilled ? styles.button : { ...styles.button, opacity: 0.6 }}
                    >
                        {loading ? "Registering..." : "Register"}
                    </button>
                    {formData.phone_number && formData.phone_number.length > 0 && formData.phone_number.length !== 10 && (
                        <div style={styles.phoneError}>Phone number must be exactly 10 digits</div>
                    )}
                </form>

                <div style={styles.loginLink}>
                    Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
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
    registerBox: {
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
    textarea: {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        resize: "vertical",
    },
    select: {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        backgroundColor: "white",
    },
    button: {
        padding: "0.75rem",
        backgroundColor: "#2ecc71",
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
    loginLink: {
        textAlign: "center",
        marginTop: "1rem",
        color: "#7f8c8d",
    },
    link: {
        color: "#3498db",
        textDecoration: "none",
    },
    noServicesText: {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        color: "#7f8c8d",
        fontStyle: "italic",
    },
    checkboxContainer: {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        padding: "10px",
        border: "1px solid #ddd",
        borderRadius: "4px",
        maxHeight: "200px",
        overflowY: "auto",
        backgroundColor: "white",
    },
    checkboxLabel: {
        display: "flex",
        alignItems: "center",
        fontSize: "0.9rem",
        cursor: "pointer",
        padding: "5px",
        margin: 0,
        flex: "1 1 auto",
        minWidth: "150px",
    },
    checkboxInput: {
        marginRight: "5px",
    },
    phoneError: {
        color: "#e74c3c",
        fontSize: "0.85rem",
        marginTop: "5px",
        marginLeft: "2px",
        fontStyle: "italic",
    },
};

export default Register;