/**
 * Earnings Component
 * Displays worker's earnings and payment information
 */
import React, { useState, useEffect } from "react";
import api from "../api";

function Earnings() {
    const [earningsData, setEarningsData] = useState({
        totalEarnings: 0,
        monthlyEarnings: 0,
        completedJobs: 0,
        pendingPayments: 0,
        paymentHistory: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarningsData = async () => {
            try {
                setLoading(true);

                // Get bookings assigned to this worker
                const bookingsResponse = await api.get('/workers/bookings/');
                const workerBookings = bookingsResponse.data;

                // Calculate earnings based on completed bookings with payments
                let totalEarnings = 0;
                let monthlyEarnings = 0;
                let completedJobs = 0;
                let pendingPayments = 0;

                const paymentHistory = [];

                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                workerBookings.forEach(booking => {
                    // Count completed jobs
                    if (booking.status === 'COMPLETED') {
                        completedJobs++;

                        // If payment exists, add to earnings
                        if (booking.payment && booking.payment.payment_status === 'SUCCESS') {
                            const providerAmount = parseFloat(booking.payment.provider_amount) || 0;
                            totalEarnings += providerAmount;

                            // Use payment date if available, otherwise use booking date
                            const paymentDate = booking.payment?.created_at ? new Date(booking.payment.created_at) : new Date(booking.created_at || booking.updated_at);
                            if (paymentDate.getMonth() === currentMonth &&
                                paymentDate.getFullYear() === currentYear) {
                                monthlyEarnings += providerAmount;
                            }

                            // Add to payment history
                            paymentHistory.push({
                                id: booking.id,
                                date: paymentDate.toLocaleDateString(),
                                user: booking.user?.username || booking.user_username || 'Unknown',
                                job: booking.service_detail?.name || booking.service_name || booking.service,
                                amount: providerAmount,
                                status: 'Completed'
                            });
                        } else if (booking.payment && booking.payment.payment_status !== 'SUCCESS') {
                            // If payment exists but not successful, it might be pending
                            pendingPayments += parseFloat(booking.payment.provider_amount) || 0;
                        }
                    }
                });

                // Sort payment history by date (most recent first)
                paymentHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

                setEarningsData({
                    totalEarnings,
                    monthlyEarnings,
                    completedJobs,
                    pendingPayments,
                    paymentHistory
                });
            } catch (error) {
                console.error('Error fetching earnings data:', error);
                // Set default values in case of error
                setEarningsData({
                    totalEarnings: 0,
                    monthlyEarnings: 0,
                    completedJobs: 0,
                    pendingPayments: 0,
                    paymentHistory: []
                });
            } finally {
                setLoading(false);
            }
        };

        fetchEarningsData();
    }, []);

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading earnings information...</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>Earnings Dashboard</h1>
                <p style={styles.subtitle}>Track your income and payment history</p>
            </div>

            {/* Earnings Summary Cards */}
            <div style={styles.summarySection}>
                <div style={styles.summaryCards}>
                    <div style={styles.summaryCard}>
                        <div style={styles.cardIcon}>💰</div>
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}>Total Earnings</h3>
                            <p style={styles.cardValue}>₹{earningsData.totalEarnings.toLocaleString()}</p>
                        </div>
                    </div>

                    <div style={styles.summaryCard}>
                        <div style={styles.cardIcon}>📊</div>
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}>Monthly Earnings</h3>
                            <p style={styles.cardValue}>₹{earningsData.monthlyEarnings.toLocaleString()}</p>
                        </div>
                    </div>

                    <div style={styles.summaryCard}>
                        <div style={styles.cardIcon}>✅</div>
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}>Completed Jobs</h3>
                            <p style={styles.cardValue}>{earningsData.completedJobs}</p>
                        </div>
                    </div>

                    <div style={styles.summaryCard}>
                        <div style={styles.cardIcon}>💳</div>
                        <div style={styles.cardContent}>
                            <h3 style={styles.cardTitle}>Pending Payments</h3>
                            <p style={styles.cardValue}>₹{earningsData.pendingPayments.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div style={styles.historySection}>
                <h2 style={styles.sectionTitle}>Payment History</h2>

                {earningsData.paymentHistory.length > 0 ? (
                    <div style={styles.tableContainer}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeaderRow}>
                                    <th style={styles.tableHeader}>Date</th>
                                    <th style={styles.tableHeader}>User</th>
                                    <th style={styles.tableHeader}>Job</th>
                                    <th style={styles.tableHeader}>Amount</th>
                                    <th style={styles.tableHeader}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earningsData.paymentHistory.map(payment => (
                                    <tr key={payment.id} style={styles.tableRow}>
                                        <td style={styles.tableCell}>{payment.date}</td>
                                        <td style={styles.tableCell}>{payment.user}</td>
                                        <td style={styles.tableCell}>{payment.job}</td>
                                        <td style={styles.tableCell}>₹{payment.amount.toLocaleString()}</td>
                                        <td style={styles.tableCell}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                backgroundColor: payment.status === 'Paid' ? '#27ae60' : '#f39c12'
                                            }}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <p>No payment history yet. Complete jobs to start earning!</p>
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
    header: {
        marginBottom: "2rem",
    },
    pageTitle: {
        fontSize: "2.5rem",
        color: "#2c3e50",
        margin: "0 0 0.5rem 0",
    },
    subtitle: {
        fontSize: "1.1rem",
        color: "#7f8c8d",
        margin: "0",
    },
    summarySection: {
        marginBottom: "2rem",
    },
    summaryCards: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
    },
    summaryCard: {
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
    },
    cardIcon: {
        fontSize: "2.5rem",
        marginRight: "1rem",
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        margin: "0 0 0.5rem 0",
        fontSize: "1.1rem",
        color: "#7f8c8d",
    },
    cardValue: {
        margin: "0",
        fontSize: "2rem",
        fontWeight: "bold",
        color: "#2c3e50",
    },
    historySection: {
        marginBottom: "2rem",
    },
    sectionTitle: {
        fontSize: "1.8rem",
        color: "#2c3e50",
        marginBottom: "1.5rem",
    },
    tableContainer: {
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "white",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    tableHeaderRow: {
        backgroundColor: "#34495e",
        color: "white",
    },
    tableHeader: {
        padding: "1rem",
        textAlign: "left",
        fontWeight: "600",
    },
    tableRow: {
        borderBottom: "1px solid #ecf0f1",
    },
    tableRowHover: {
        backgroundColor: "#f8f9fa",
    },
    tableCell: {
        padding: "1rem",
        textAlign: "left",
        minWidth: "120px",
    },
    statusBadge: {
        padding: "0.4rem 0.8rem",
        borderRadius: "20px",
        color: "white",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
    emptyState: {
        backgroundColor: "white",
        padding: "2rem",
        textAlign: "center",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
    paymentMethodsSection: {
        marginBottom: "2rem",
    },
    paymentMethods: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1.5rem",
    },
    paymentMethodCard: {
        backgroundColor: "white",
        padding: "1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
    },
    paymentIcon: {
        fontSize: "2rem",
        marginRight: "1rem",
    },
    paymentInfo: {
        flex: 1,
    },
    paymentTitle: {
        margin: "0 0 0.25rem 0",
        fontSize: "1.2rem",
        color: "#2c3e50",
    },
    paymentDetail: {
        margin: "0",
        color: "#7f8c8d",
    },
    loading: {
        textAlign: "center",
        fontSize: "1.2rem",
        color: "#7f8c8d",
        padding: "2rem",
    }
};

export default Earnings;