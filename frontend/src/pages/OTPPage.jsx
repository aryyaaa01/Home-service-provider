/**
 * OTP Verification Component
 * Allows workers to verify OTP for completing jobs
 */
import React, { useState } from "react";
import { useNotification } from "../hooks/useNotification";
import api from "../api";

function OTPPage() {
    const [formData, setFormData] = useState({
        booking_id: "",
        otp_code: "",
    });
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        api.post("workers/verify-otp/", formData)
            .then((res) => {
                showNotification(res.data.message || res.data.detail, "success");
                // Reset form
                setFormData({ booking_id: "", otp_code: "" });
            })
            .catch((err) => {
                console.error("OTP verification error:", err);
                const errorMsg = err.response?.data?.non_field_errors?.[0] ||
                    err.response?.data?.detail ||
                    "OTP verification failed. Please check the code and booking ID.";
                showNotification(errorMsg, "error");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <div style={styles.container}>
            <div style={styles.otpBox}>
                <h2>Verify OTP</h2>
                <p>Enter the OTP provided by the customer to complete the job.</p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Booking ID:</label>
                        <input
                            type="number"
                            name="booking_id"
                            value={formData.booking_id}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>OTP Code:</label>
                        <input
                            type="text"
                            name="otp_code"
                            value={formData.otp_code}
                            onChange={handleInputChange}
                            required
                            style={styles.input}
                            maxLength="6"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>
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
    otpBox: {
        backgroundColor: "rgba(255, 255, 255, 0.7)", // Semi-transparent background
        padding: "2rem",
        borderRadius: "8px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
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
        backgroundColor: "#f39c12",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        cursor: "pointer",
    },
};

export default OTPPage;