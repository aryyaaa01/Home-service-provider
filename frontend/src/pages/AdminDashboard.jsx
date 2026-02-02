/**
 * Admin Dashboard
 * Allows admin to manage workers, users, and bookings
 */
import React, { useState, useEffect } from "react";
import { useNotification } from "../hooks/useNotification";
import api from "../api";
import { useSearchParams } from "react-router-dom";

function AdminDashboard() {
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const urlTab = searchParams.get('tab');
        return urlTab || "workers"; // Default tab
    });
    const [workers, setWorkers] = useState([]);
    const [users, setUsers] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [ratings, setRatings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [suggestedDate, setSuggestedDate] = useState('');
    const [suggestedTime, setSuggestedTime] = useState('');
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    const [newService, setNewService] = useState({
        name: "",
        description: "",
        price: "",
        duration: "",
        category: "OTHER"
    });
    const [showServiceForm, setShowServiceForm] = useState(false);
    const { showNotification } = useNotification();

    // Load data on component mount and when active tab changes
    useEffect(() => {
        loadData();
    }, [activeTab, searchParams]);

    // Update active tab when URL parameters change
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && activeTab !== tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, activeTab]);

    const loadData = () => {
        setLoading(true);

        // Load different data based on active tab
        switch (activeTab) {
            case "workers":
                Promise.all([
                    api.get("admin/workers/"),
                    api.get("services/")
                ])
                    .then(([workersRes, servicesRes]) => {
                        setWorkers(workersRes.data);
                        setAllServices(servicesRes.data);
                    })
                    .catch(err => {
                        console.error("Error loading workers:", err);
                        showNotification("Failed to load workers.", "error");
                    });
                break;

            case "users":
                api.get("admin/users/")
                    .then(res => setUsers(res.data))
                    .catch(err => {
                        console.error("Error loading users:", err);
                        showNotification("Failed to load users.", "error");
                    });
                break;

            case "bookings":
                Promise.all([
                    api.get("admin/bookings/"),
                    api.get("admin/workers/"),
                    api.get("services/")
                ])
                    .then(([bookingsRes, workersRes, servicesRes]) => {
                        setBookings(bookingsRes.data);
                        setWorkers(workersRes.data);
                        setAllServices(servicesRes.data);
                    })
                    .catch(err => {
                        console.error("Error loading bookings:", err);
                        showNotification("Failed to load bookings.", "error");
                    });
                break;

            case "services":
                Promise.all([
                    api.get("services/"),
                    api.get("admin/ratings/")
                ])
                    .then(([servicesRes, ratingsRes]) => {
                        setAllServices(servicesRes.data);
                        setRatings(ratingsRes.data);
                    })
                    .catch(err => {
                        console.error("Error loading services:", err);
                        showNotification("Failed to load services.", "error");
                    });
                break;

            case "ratings":
                api.get("admin/ratings/")
                    .then(res => setRatings(res.data))
                    .catch(err => {
                        console.error("Error loading ratings:", err);
                        showNotification("Failed to load ratings.", "error");
                    });
                break;

            case "payments":
                // Load all bookings to get payment information
                api.get("admin/bookings/")
                    .then(res => {
                        // Filter bookings that have payments
                        const bookingsWithPayments = res.data.filter(booking => booking.payment);
                        setPayments(bookingsWithPayments);
                    })
                    .catch(err => {
                        console.error("Error loading payments:", err);
                        showNotification("Failed to load payments.", "error");
                    });
                break;

            default:
                break;
        }

        setLoading(false);
    };

    const handleApproval = (workerId, action) => {
        api.post(`admin/workers/${workerId}/approval/`, { action })
            .then(res => {
                showNotification(res.data.detail || 'Action completed successfully', "success");
                // Refresh data
                loadData();
            })
            .catch(err => {
                console.error("Error updating worker approval:", err);
                const errorMsg = err.response?.data?.error || "Failed to update worker approval.";
                showNotification(errorMsg, "error");
            });
    };

    const handleAssignWorker = (bookingId, workerId) => {
        api.post(`admin/bookings/${bookingId}/assign-worker/`, { worker_id: workerId })
            .then(res => {
                showNotification(res.data.message, "success");
                // Close modal and refresh data
                setSelectedBooking(null);
                loadData();
            })
            .catch(err => {
                console.error("Error assigning worker:", err);
                const errorMsg = err.response?.data?.error || "Failed to assign worker.";
                showNotification(errorMsg, "error");
            });
    };

    const handleCreateService = (e) => {
        e.preventDefault();
        setLoading(true);

        // Prepare service data with correct field names
        const serviceData = {
            name: newService.name,
            description: newService.description,
            price: newService.price,
            estimated_duration: newService.duration,
            category: newService.category
        };

        api.post("services/", serviceData)
            .then(res => {
                showNotification("Service created successfully!", "success");
                // Reset form and refresh data
                setNewService({ name: "", description: "", price: "", duration: "" });
                setShowServiceForm(false);
                loadData();
            })
            .catch(err => {
                console.error("Error creating service:", err);
                const errorMsg = err.response?.data?.name?.[0] || "Failed to create service.";
                showNotification(errorMsg, "error");
            })
            .finally(() => setLoading(false));
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

    const handleSuggestTime = (booking) => {
        setSelectedBooking(booking);
        setShowSuggestionModal(true);
    };

    const submitSuggestion = () => {
        if (!suggestedDate || !suggestedTime) {
            showNotification('Please enter both date and time', 'error');
            return;
        }

        setLoading(true);
        api.post(`bookings/${selectedBooking.id}/suggest-delayed/`, {
            suggested_date: suggestedDate,
            suggested_time: suggestedTime
        })
            .then(res => {
                showNotification(res.data.message, 'success');
                setShowSuggestionModal(false);
                setSuggestedDate('');
                setSuggestedTime('');
                setSelectedBooking(null);
                loadData(); // Refresh data
            })
            .catch(err => {
                console.error('Error suggesting time:', err);
                const errorMsg = err.response?.data?.error || 'Failed to suggest time';
                showNotification(errorMsg, 'error');
            })
            .finally(() => setLoading(false));
    };

    const closeModal = () => {
        setShowSuggestionModal(false);
        setSuggestedDate('');
        setSuggestedTime('');
        setSelectedBooking(null);
    };

    return (
        <div style={styles.container}>
            <h1>Admin Dashboard - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>

            {/* Loading indicator */}
            {loading && <p style={styles.loading}>Loading...</p>}

            {/* Workers Tab */}
            {activeTab === "workers" && (
                <div style={styles.section}>
                    <h2>Manage Workers</h2>
                    {workers.length === 0 ? (
                        <p>No workers registered yet.</p>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Username</th>
                                        <th style={styles.th}>Email</th>
                                        <th style={styles.th}>Phone</th>
                                        <th style={styles.th}>Services</th>
                                        <th style={styles.th}>Approved</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map((w) => (
                                        <tr key={w.id} style={{
                                            ...styles.tableRow,
                                            backgroundColor: w.id % 2 === 0 ? '#f8fafc' : 'white'
                                        }}>
                                            <td style={styles.td}>{w.id}</td>
                                            <td style={styles.td}>{w.username}</td>
                                            <td style={styles.td}>{w.email}</td>
                                            <td style={styles.td}>{w.phone_number || 'Not provided'}</td>
                                            <td style={styles.td}>
                                                {w.services && w.services.length > 0 ? (
                                                    <div>
                                                        {w.services.map(service => (
                                                            <span key={service.id} style={{
                                                                display: 'inline-block',
                                                                padding: '2px 6px',
                                                                margin: '2px',
                                                                backgroundColor: '#3498db',
                                                                color: 'white',
                                                                borderRadius: '4px',
                                                                fontSize: '0.8rem'
                                                            }}>
                                                                {service.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>No services assigned</span>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: w.is_approved ? "#27ae60" : "#e74c3c",
                                                }}>
                                                    {w.is_approved ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {!w.is_approved ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApproval(w.id, "approve")}
                                                            style={styles.approveButton}
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleApproval(w.id, "reject")}
                                                            style={styles.rejectButton}
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ color: "#95a5a6", fontStyle: "italic" }}>Approved</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
                <div style={styles.section}>
                    <h2>Registered Users</h2>
                    {users.length === 0 ? (
                        <p>No users registered yet.</p>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>Username</th>
                                        <th style={styles.th}>Email</th>
                                        <th style={styles.th}>Phone Number</th>
                                        <th style={styles.th}>Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} style={{
                                            ...styles.tableRow,
                                            backgroundColor: u.id % 2 === 0 ? '#f8fafc' : 'white'
                                        }}>
                                            <td style={styles.td}>{u.id}</td>
                                            <td style={styles.td}>{u.username}</td>
                                            <td style={styles.td}>{u.email}</td>
                                            <td style={styles.td}>{u.phone_number || 'Not provided'}</td>
                                            <td style={styles.td}>{u.address || 'Not provided'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Bookings Tab */}
            {activeTab === "bookings" && (
                <div style={styles.section}>
                    <h2>All Bookings</h2>
                    {bookings.length === 0 ? (
                        <p>No bookings in the system yet.</p>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>ID</th>
                                        <th style={styles.th}>User</th>
                                        <th style={styles.th}>Service</th>
                                        <th style={styles.th}>Worker</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Scheduled Time</th>
                                        <th style={styles.th}>Suggested Time</th>
                                        <th style={styles.th}>Address</th>
                                        <th style={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id} style={{
                                            ...styles.tableRow,
                                            backgroundColor: b.id % 2 === 0 ? '#f8fafc' : 'white'
                                        }}>
                                            <td style={styles.td}>{b.id}</td>
                                            <td style={styles.td}>{b.user_username}</td>
                                            <td style={styles.td}>{b.service_name}</td>
                                            <td style={styles.td}>{b.worker_username || "Not assigned"}</td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: getStatusColor(b.status),
                                                }}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                {b.scheduled_date} at {b.scheduled_time}
                                            </td>
                                            <td style={styles.td}>
                                                {b.suggested_date && b.suggested_time ? (
                                                    <div>
                                                        <div>{b.suggested_date} at {b.suggested_time}</div>
                                                        <div style={{ fontSize: '0.8em', color: '#7f8c8d' }}>
                                                            Original: {b.scheduled_date} at {b.scheduled_time}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#95a5a6' }}>No suggestion</span>
                                                )}
                                            </td>
                                            <td style={{ ...styles.td, maxWidth: '200px', wordWrap: 'break-word' }}>{b.address}</td>
                                            <td style={styles.td}>
                                                {!b.worker && b.status === "PENDING" ? (
                                                    <button
                                                        onClick={() => setSelectedBooking(b)}
                                                        style={styles.assignButton}
                                                    >
                                                        Assign Worker
                                                    </button>
                                                ) : b.status === "DELAYED" ? (
                                                    <button
                                                        onClick={() => handleSuggestTime(b)}
                                                        style={{
                                                            ...styles.assignButton,
                                                            backgroundColor: '#e67e22'
                                                        }}
                                                    >
                                                        Suggest New Time
                                                    </button>
                                                ) : (
                                                    <span style={{ color: "#95a5a6", fontStyle: "italic" }}>
                                                        {b.worker ? "Assigned" : "N/A"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
                <div style={styles.section}>
                    <div style={styles.servicesHeader}>
                        <h2>Manage Services</h2>
                        <button
                            onClick={() => setShowServiceForm(!showServiceForm)}
                            style={styles.addButton}
                        >
                            {showServiceForm ? "Cancel" : "+ Add Service"}
                        </button>
                    </div>

                    {/* Add Service Form */}
                    {showServiceForm && (
                        <div style={styles.addServiceForm}>
                            <h3>Add New Service</h3>
                            <form onSubmit={handleCreateService} style={styles.form}>
                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Service Name:</label>
                                        <input
                                            type="text"
                                            value={newService.name}
                                            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                            required
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Price (₹):</label>
                                        <input
                                            type="number"
                                            value={newService.price}
                                            onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                <div style={styles.formRow}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Duration (hours):</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={newService.duration}
                                            onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.formGroup}>
                                        <label style={styles.label}>Category:</label>
                                        <select
                                            value={newService.category || "OTHER"}
                                            onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                                            style={styles.input}
                                        >
                                            <option value="CLEANING">Cleaning</option>
                                            <option value="ELECTRICIAN">Electrician</option>
                                            <option value="PLUMBING">Plumbing</option>
                                            <option value="CARPENTRY">Carpentry</option>
                                            <option value="PAINTING">Painting</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Description:</label>
                                    <textarea
                                        value={newService.description}
                                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                        style={styles.textarea}
                                        rows="3"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={styles.submitButton}
                                >
                                    {loading ? "Creating..." : "Create Service"}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Services List */}
                    <div style={styles.servicesList}>
                        {allServices.length === 0 ? (
                            <p>No services available yet.</p>
                        ) : (
                            <div style={styles.tableContainer}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr style={styles.tableHeader}>
                                            <th style={styles.th}>ID</th>
                                            <th style={styles.th}>Name</th>
                                            <th style={styles.th}>Description</th>
                                            <th style={styles.th}>Price</th>
                                            <th style={styles.th}>Duration</th>
                                            <th style={styles.th}>Avg Rating</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allServices.map((s) => (
                                            <tr key={s.id} style={{
                                                ...styles.tableRow,
                                                backgroundColor: s.id % 2 === 0 ? '#f8fafc' : 'white'
                                            }}>
                                                <td style={styles.td}>{s.id}</td>
                                                <td style={styles.td}>{s.name}</td>
                                                <td style={styles.td}>{s.description}</td>
                                                <td style={styles.td}>₹{s.price || "Not set"}</td>
                                                <td style={styles.td}>{s.estimated_duration || "Not set"}</td>
                                                <td style={styles.td}>
                                                    <div style={styles.ratingDisplay}>
                                                        <span style={styles.ratingStars}>
                                                            {'★'.repeat(Math.floor(s.average_rating || 0))}
                                                            {'☆'.repeat(5 - Math.floor(s.average_rating || 0))}
                                                        </span>
                                                        <span style={styles.ratingValue}>({s.average_rating ? s.average_rating.toFixed(1) : '0'})</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Ratings & Reviews Tab */}
            {activeTab === "ratings" && (
                <div style={styles.section}>
                    <h2>All Ratings & Reviews</h2>
                    {ratings.length === 0 ? (
                        <p>No ratings and reviews yet.</p>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>Booking ID</th>
                                        <th style={styles.th}>User</th>
                                        <th style={styles.th}>Worker</th>
                                        <th style={styles.th}>Service</th>
                                        <th style={styles.th}>Rating</th>
                                        <th style={styles.th}>Review</th>
                                        <th style={styles.th}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ratings.map((rating) => (
                                        <tr key={rating.id} style={{
                                            ...styles.tableRow,
                                            backgroundColor: rating.id % 2 === 0 ? '#f8fafc' : 'white'
                                        }}>
                                            <td style={styles.td}>{rating.booking}</td>
                                            <td style={styles.td}>{rating.user_username}</td>
                                            <td style={styles.td}>{rating.worker_username}</td>
                                            <td style={styles.td}>{rating.service_name}</td>
                                            <td style={styles.td}>
                                                <div style={{ display: "flex", alignItems: "center" }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} style={{ color: i < rating.rating ? "#f39c12" : "#bdc3c7", fontSize: "1.2rem" }}>
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{rating.rating}/5</span>
                                                </div>
                                            </td>
                                            <td style={styles.td}>{rating.review || "No review provided"}</td>
                                            <td style={styles.td}>{new Date(rating.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
                <div style={styles.section}>
                    <h2>Payment Transactions</h2>
                    {payments.length === 0 ? (
                        <p>No payment transactions recorded yet.</p>
                    ) : (
                        <div style={styles.tableContainer}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.tableHeader}>
                                        <th style={styles.th}>Booking ID</th>
                                        <th style={styles.th}>User</th>
                                        <th style={styles.th}>Service</th>
                                        <th style={styles.th}>Worker</th>
                                        <th style={styles.th}>Total Amount</th>
                                        <th style={styles.th}>Admin Commission (20%)</th>
                                        <th style={styles.th}>Provider Amount (80%)</th>
                                        <th style={styles.th}>Payment Status</th>
                                        <th style={styles.th}>Payment Method</th>
                                        <th style={styles.th}>Transaction ID</th>
                                        <th style={styles.th}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((booking) => (
                                        <tr key={booking.id} style={{
                                            ...styles.tableRow,
                                            backgroundColor: booking.id % 2 === 0 ? '#f8fafc' : 'white'
                                        }}>
                                            <td style={styles.td}>{booking.id}</td>
                                            <td style={styles.td}>{booking.user_username}</td>
                                            <td style={styles.td}>{booking.service_name}</td>
                                            <td style={styles.td}>{booking.worker_username || "Not assigned"}</td>
                                            <td style={styles.td}>₹{booking.payment.total_amount}</td>
                                            <td style={styles.td}>₹{booking.payment.admin_commission}</td>
                                            <td style={styles.td}>₹{booking.payment.provider_amount}</td>
                                            <td style={styles.td}>
                                                <span style={{
                                                    ...styles.statusBadge,
                                                    backgroundColor: booking.payment.payment_status === 'SUCCESS' ? '#27ae60' : '#e74c3c'
                                                }}>
                                                    {booking.payment.payment_status}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{booking.payment.payment_method}</td>
                                            <td style={styles.td}>{booking.payment.transaction_id}</td>
                                            <td style={styles.td}>{new Date(booking.payment.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Assign Worker Modal */}
            {selectedBooking && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3>Assign Worker to Booking #{selectedBooking.id}</h3>
                        <p>Service: {selectedBooking.service_name}</p>
                        <p>Customer: {selectedBooking.user_username}</p>
                        <p>Scheduled: {selectedBooking.scheduled_date} at {selectedBooking.scheduled_time}</p>

                        <div style={styles.modalContent}>
                            <h4>Available Workers</h4>
                            {/* Get the service category for the selected booking */}
                            {(() => {
                                const bookingService = allServices.find(service => service.name === selectedBooking.service_name);
                                const requiredCategory = bookingService ? bookingService.category : null;

                                // Filter workers who are approved and provide the required service category
                                console.log('Selected booking service name:', selectedBooking.service_name);
                                console.log('All services:', allServices);
                                console.log('All workers:', workers);

                                const availableWorkers = workers.filter(w => {
                                    console.log(`Checking worker ${w.username}:`, w);
                                    console.log(`Worker services:`, w.services);
                                    const hasService = w.services &&
                                        Array.isArray(w.services) &&
                                        w.services.some(s => {
                                            console.log(`Comparing: "${s.name}" === "${selectedBooking.service_name}"`);
                                            console.log(`Match result:`, s.name === selectedBooking.service_name);
                                            return s.name === selectedBooking.service_name;
                                        });
                                    console.log(`Worker ${w.username} has service:`, hasService);
                                    return w.is_approved && hasService;
                                });

                                if (availableWorkers.length === 0) {
                                    return (
                                        <p>
                                            No {requiredCategory ? requiredCategory.toLowerCase() : 'qualified'} workers available for this service.
                                        </p>
                                    );
                                }

                                return (
                                    <ul style={styles.workerList}>
                                        {availableWorkers.map((w) => (
                                            <li key={w.id} style={styles.workerItem}>
                                                <div>
                                                    <strong>{w.username}</strong>
                                                    <div style={{ fontSize: '0.9em', color: '#7f8c8d' }}>
                                                        {w.services && w.services.length > 0
                                                            ? `Specializes in: ${w.services.map(s => s.name).join(', ')}`
                                                            : 'No specializations defined'}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAssignWorker(selectedBooking.id, w.id)}
                                                    style={styles.assignWorkerButton}
                                                >
                                                    Assign
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                );
                            })()}
                        </div>

                        <button
                            onClick={() => setSelectedBooking(null)}
                            style={styles.closeModalButton}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Suggest Time Modal */}
            {showSuggestionModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3>Suggest New Time for Booking #{selectedBooking?.id}</h3>
                        <p>Service: {selectedBooking?.service_name}</p>
                        <p>Customer: {selectedBooking?.user_username}</p>
                        <p>Original Time: {selectedBooking?.scheduled_date} at {selectedBooking?.scheduled_time}</p>

                        <div style={styles.modalContent}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Suggested Date:</label>
                                <input
                                    type="date"
                                    value={suggestedDate}
                                    onChange={(e) => setSuggestedDate(e.target.value)}
                                    style={styles.input}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>Suggested Time:</label>
                                <input
                                    type="time"
                                    value={suggestedTime}
                                    onChange={(e) => setSuggestedTime(e.target.value)}
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <button
                                onClick={submitSuggestion}
                                disabled={loading}
                                style={{
                                    ...styles.assignButton,
                                    backgroundColor: '#27ae60',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Sending...' : 'Send Suggestion'}
                            </button>
                            <button
                                onClick={closeModal}
                                style={{
                                    ...styles.closeModalButton,
                                    backgroundColor: '#95a5a6'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

const styles = {
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
    },



    section: {
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "2rem",
    },
    loading: {
        textAlign: "center",
        padding: "2rem",
        fontSize: "1.2rem",
        color: "#7f8c8d",
    },
    tableContainer: {
        overflowX: "auto",
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        marginBottom: "2rem",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    tableHeader: {
        backgroundColor: "#2c3e50",
        color: "white",
    },
    th: {
        padding: "1rem",
        textAlign: "left",
        fontWeight: "600",
        fontSize: "0.9rem",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    tableRow: {
        borderBottom: "1px solid #e1e8ed",
        transition: "background-color 0.2s ease",
    },
    tableRowHover: {
        backgroundColor: "#f8fafc",
    },
    td: {
        padding: "1rem",
        verticalAlign: "top",
    },
    statusBadge: {
        padding: "0.4rem 0.8rem",
        borderRadius: "20px",
        color: "white",
        fontSize: "0.85rem",
        fontWeight: "600",
        display: "inline-block",
        minWidth: "80px",
        textAlign: "center",
        textTransform: "capitalize",
    },
    approveButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#2ecc71",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        marginRight: "0.5rem",
    },
    rejectButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#e74c3c",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    assignButton: {
        padding: "0.5rem 1rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    assignWorkerButton: {
        padding: "0.25rem 0.75rem",
        backgroundColor: "#9b59b6",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "0.8rem",
    },
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "600px",
        maxHeight: "90vh",
        overflowY: "auto",
    },
    modalContent: {
        marginTop: "1rem",
    },
    workerList: {
        listStyle: "none",
        padding: 0,
    },
    workerItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem",
        borderBottom: "1px solid #ecf0f1",
    },
    closeModalButton: {
        marginTop: "1rem",
        padding: "0.75rem 1.5rem",
        backgroundColor: "#95a5a6",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    servicesHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
    },
    addButton: {
        padding: "0.75rem 1.5rem",
        backgroundColor: "#2ecc71",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
    },
    addServiceForm: {
        backgroundColor: "#f8f9fa",
        padding: "1.5rem",
        borderRadius: "8px",
        marginBottom: "2rem",
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
    textarea: {
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        resize: "vertical",
    },
    submitButton: {
        padding: "0.75rem",
        backgroundColor: "#3498db",
        color: "white",
        border: "none",
        borderRadius: "4px",
        fontSize: "1rem",
        fontWeight: "500",
        cursor: "pointer",
        alignSelf: "flex-start",
    },
    servicesList: {
        marginTop: "2rem",
    },
    ratingDisplay: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
    },
    ratingStars: {
        color: "#f39c12",
        fontSize: "1.1rem",
    },
    ratingValue: {
        fontSize: "0.9rem",
        color: "#7f8c8d",
    },
};

export default AdminDashboard;