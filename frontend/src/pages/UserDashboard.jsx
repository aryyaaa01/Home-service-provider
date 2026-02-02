/**
 * User Dashboard
 * Allows users to create bookings and view booking history
 */
import React, { useEffect, useState } from "react";
import { useNotification } from "../hooks/useNotification";
import api from "../api";
import RatingReview from "../components/RatingReview.jsx";
import { useSearchParams, useNavigate } from 'react-router-dom';


function UserDashboard() {
    const navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [serviceId, setServiceId] = useState(() => {
        // Check if a service was selected from the home page
        const selectedService = localStorage.getItem('selectedService');
        if (selectedService) {
            const service = JSON.parse(selectedService);
            localStorage.removeItem('selectedService'); // Clear after using
            return service.id.toString();
        }
        return "";
    });
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [address, setAddress] = useState("");
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();

    // Helper function to convert 24-hour time to 12-hour format
    const formatTimeTo12Hour = (time24) => {
        if (!time24) return '';

        // Split the time string (e.g., "13:23") into hours and minutes
        const [hours, minutes] = time24.split(':').map(Number);

        // Validate inputs
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return time24; // Return original if invalid
        }

        // Determine AM or PM
        const period = hours >= 12 ? 'PM' : 'AM';

        // Convert hour from 24-hour to 12-hour format
        const hour12 = hours % 12 || 12; // If hour is 0 or 12, display as 12

        // Format the minutes to always have 2 digits
        const formattedMinutes = minutes.toString().padStart(2, '0');

        return `${hour12}:${formattedMinutes} ${period}`;
    };

    // Helper function to format the date and time together
    const formatDateTime = (date, time) => {
        if (!date || !time) return `${date || ''} at ${time || ''}`;
        return `${date} at ${formatTimeTo12Hour(time)}`;
    };


    // Form state - already declared above

    // Form state - already declared above

    const loadData = () => {
        // Fetch services
        api.get("services/")
            .then((res) => setServices(res.data))
            .catch((err) => console.error(err));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateBooking = (e) => {
        e.preventDefault();
        setLoading(true);

        api.post("bookings/", {
            service: parseInt(serviceId),
            date: date,
            time_slot: time,
            address: address,
        })
            .then((res) => {
                showNotification("Booking created successfully!", "success");
                // Reset form
                setServiceId("");
                setDate("");
                setTime("");
                setAddress("");
                // Refresh data
                loadData();
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.non_field_errors?.[0] ||
                    err.response?.data?.service?.[0] ||
                    "Failed to create booking. Please try again.";
                showNotification(errorMsg, "error");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "#f39c12";
            case "ASSIGNED":
                return "#3498db";
            case "REACHED":
                return "#1abc9c";
            case "IN_PROGRESS":
                return "#9b59b6";
            case "COMPLETED":
                return "#27ae60";
            case "DELAYED":
                return "#e67e22";
            case "CANCELLED":
                return "#e74c3c";
            default:
                return "#95a5a6";
        }
    };

    const handlePayment = (bookingId) => {
        // Navigate to the payment page
        navigate(`/payment/${bookingId}`);
    };

    const handleDeleteService = (serviceId) => {
        if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
            return;
        }

        setLoading(prev => ({ ...prev, [`delete_${serviceId}`]: true }));

        api.delete('services/', {
            data: { service_id: serviceId }
        })
            .then((res) => {
                showNotification(res.data.message, "success");
                loadData(); // Refresh services list
            })
            .catch((err) => {
                const errorMsg = err.response?.data?.error || "Failed to delete service. Please try again.";
                showNotification(errorMsg, "error");
            })
            .finally(() => {
                setLoading(prev => ({ ...prev, [`delete_${serviceId}`]: false }));
            });
    };



    return (
        <div style={styles.container}>
            <h1>User Dashboard</h1>

            {/* Booking Form */}
            <div id="booking-form" style={styles.section}>
                <h2>Book a New Service</h2>
                <form onSubmit={handleCreateBooking} style={styles.form}>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Service:</label>
                            <select
                                value={serviceId}
                                onChange={(e) => setServiceId(e.target.value)}
                                required
                                style={styles.select}
                            >
                                <option value="">-- Select a Service --</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Date:</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Time:</label>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Address:</label>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                style={styles.input}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={styles.button}
                    >
                        {loading ? "Creating Booking..." : "Create Booking"}
                    </button>
                </form>
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
    section: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        padding: "1.5rem",
        marginBottom: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
    formRow: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
    select: {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        backgroundColor: "white",
    },
    serviceSelectContainer: {
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
    },
    deleteServiceButton: {
        padding: "0.75rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        minWidth: "40px",
        height: "42px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    button: {
        padding: "0.75rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
    },
    payButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#27ae60",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
    },
    cancelButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "0.9rem",
        fontWeight: "500",
        cursor: "pointer",
        marginLeft: "0.5rem",
    },
    successMessage: {
        color: "#27ae60",
        marginTop: "1rem",
        padding: "0.75rem",
        backgroundColor: "#d5f4e6",
        borderRadius: "4px",
    },
    errorMessage: {
        color: "#e74c3c",
        marginTop: "1rem",
        padding: "0.75rem",
        backgroundColor: "#fadbd8",
        borderRadius: "4px",
    },
    tableContainer: {
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHeader: {
        backgroundColor: "#34495e",
        color: "white",
    },
    th: {
        padding: "0.75rem",
        textAlign: "left",
    },
    tableRow: {
        borderBottom: "1px solid #ecf0f1",
    },
    td: {
        padding: "0.75rem",
    },
    statusBadge: {
        padding: "0.25rem 0.75rem",
        borderRadius: "12px",
        color: "white",
        fontSize: "0.85rem",
        fontWeight: "500",
    },
    statusLegend: {
        marginTop: "2rem",
        padding: "1rem",
        backgroundColor: "#ecf0f1",
        borderRadius: "4px",
    },
    flowSteps: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        marginTop: "0.5rem",
        flexWrap: "wrap",
    },
    flowStep: {
        padding: "0.5rem 1rem",
        borderRadius: "4px",
        color: "white",
        fontWeight: "500",
    },
    arrow: {
        fontSize: "1.5rem",
        color: "#7f8c8d",
    },
    notificationList: {
        listStyle: "none",
        padding: 0,
    },
    notification: {
        padding: "0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: "#f8f9fa",
        borderRadius: "4px",
        borderLeft: "3px solid #3498db",
    },
    notificationDate: {
        fontSize: "0.85rem",
        color: "#7f8c8d",
        marginRight: "0.5rem",
    },
    tabNavigation: {
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
    },
    tabButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#ecf0f1",
        border: "1px solid #bdc3c7",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
        color: "#2c3e50",
    },
    activeTabButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "1px solid #2980b9",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "500",
    },
    profileFrame: {
        border: "none",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
};

export default UserDashboard;