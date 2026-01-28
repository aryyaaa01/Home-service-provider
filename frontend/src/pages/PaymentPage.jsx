/**
 * Payment Page Component
 * Allows users to select payment methods and process payment
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useNotification } from "../hooks/useNotification";
import api from "../api";
import qrCodeImage from "../images/image.png";

function PaymentPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showNotification } = useNotification();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [upiId, setUpiId] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardName, setCardName] = useState('');
    const [processing, setProcessing] = useState(false);

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


    // Get booking details from state or fetch from API
    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const response = await api.get(`/bookings/my/`);
                const bookingData = response.data.find(b => b.id == bookingId);
                if (bookingData) {
                    setBooking(bookingData);
                } else {
                    throw new Error('Booking not found');
                }
            } catch (error) {
                console.error('Error fetching booking:', error);
                showNotification('Error fetching booking details', 'error');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };

        if (bookingId) {
            fetchBooking();
        } else {
            // If no bookingId in URL, check if booking details are passed via location state
            const bookingData = location.state?.booking;
            if (bookingData) {
                setBooking(bookingData);
                setLoading(false);
            } else {
                showNotification('Booking details not found', 'error');
                navigate(-1);
            }
        }
    }, [bookingId, location.state, navigate, showNotification]);

    const handlePayment = async () => {
        if (!paymentMethod) {
            showNotification('Please select a payment method', 'error');
            return;
        }

        // Validate required fields based on payment method
        if (paymentMethod === 'UPI' && !upiId) {
            showNotification('Please enter UPI ID', 'error');
            return;
        }

        if (paymentMethod === 'CARD' && (!cardNumber || !expiryDate || !cvv || !cardName)) {
            showNotification('Please fill all card details', 'error');
            return;
        }

        // Check if payment method is valid
        if (!['CARD', 'UPI'].includes(paymentMethod)) {
            showNotification('Please select a valid payment method', 'error');
            return;
        }

        setProcessing(true);

        try {
            const paymentData = {
                payment_method: paymentMethod,
                booking_id: bookingId || booking?.id
            };

            if (paymentMethod === 'UPI') {
                paymentData.upi_id = upiId;
            } else if (paymentMethod === 'CARD') {
                paymentData.card_number = cardNumber.replace(/\s/g, ''); // Remove spaces
                paymentData.expiry_date = expiryDate;
                paymentData.cvv = cvv;
                paymentData.card_holder_name = cardName;
            }

            // Process payment
            const response = await api.post(`/bookings/${bookingId || booking?.id}/payment/`, paymentData);

            showNotification('Payment processed successfully!', 'success');

            // Navigate back to user dashboard or booking history
            setTimeout(() => {
                navigate('/user-dashboard?tab=history');
            }, 2000);
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = error.response?.data?.error || 'Payment failed. Please try again.';
            showNotification(errorMessage, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (value.length > 16) value = value.slice(0, 16);

        // Format as XXXX XXXX XXXX XXXX
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += ' ';
            formatted += value[i];
        }

        setCardNumber(formatted);
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (value.length > 4) value = value.slice(0, 4);

        // Format as MM/YY
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2);
        }

        setExpiryDate(value);
    };

    const handleCvvChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digit characters
        if (value.length > 3) value = value.slice(0, 3);
        setCvv(value);
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loading}>Loading payment details...</div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div style={styles.container}>
                <div style={styles.error}>Booking not found</div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.paymentCard}>
                <h2 style={styles.title}>Complete Your Payment</h2>

                <div style={styles.bookingInfo}>
                    <h3>Booking Details</h3>
                    <p><strong>Booking ID:</strong> {booking.id}</p>
                    <p><strong>Service:</strong> {booking.service_name || booking.service}</p>
                    <p><strong>Date:</strong> {booking.scheduled_date || booking.date}</p>
                    <p><strong>Time:</strong> {formatTimeTo12Hour(booking.scheduled_time || booking.time_slot)}</p>
                    <p><strong>Status:</strong> <span style={{ color: booking.status === 'COMPLETED' ? '#27ae60' : '#f39c12' }}>{booking.status}</span></p>
                </div>

                <div style={styles.amountInfo}>
                    <h3>Amount to Pay</h3>
                    <p style={styles.amount}>₹{(booking?.service_detail?.price || booking?.service_price || booking?.service_total || '0')}</p>
                </div>

                <div style={styles.paymentMethods}>
                    <h3>Select Payment Method</h3>

                    <div style={styles.methodOptions}>
                        <label style={styles.methodOption}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="CARD"
                                checked={paymentMethod === 'CARD'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={styles.radioButton}
                            />
                            <div style={styles.methodCard}>
                                <div style={styles.methodIcon}>💳</div>
                                <div>
                                    <h4>Credit/Debit Card</h4>
                                    <p>Pay with your card</p>
                                </div>
                            </div>
                        </label>

                        <label style={styles.methodOption}>
                            <input
                                type="radio"
                                name="paymentMethod"
                                value="UPI"
                                checked={paymentMethod === 'UPI'}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                style={styles.radioButton}
                            />
                            <div style={styles.methodCard}>
                                <div style={styles.methodIcon}>📱</div>
                                <div>
                                    <h4>UPI</h4>
                                    <p>Pay with UPI ID</p>
                                </div>
                            </div>
                        </label>


                    </div>
                </div>

                {paymentMethod === 'CARD' && (
                    <div style={styles.cardDetails}>
                        <h3>Card Details</h3>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Card Number</label>
                            <input
                                type="text"
                                placeholder="XXXX XXXX XXXX XXXX"
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                style={styles.input}
                                maxLength="19"
                            />
                        </div>

                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Expiry Date</label>
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    value={expiryDate}
                                    onChange={handleExpiryChange}
                                    style={styles.input}
                                    maxLength="5"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>CVV</label>
                                <input
                                    type="password"
                                    placeholder="XXX"
                                    value={cvv}
                                    onChange={handleCvvChange}
                                    style={styles.input}
                                    maxLength="3"
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Card Holder Name</label>
                            <input
                                type="text"
                                placeholder="Enter card holder name"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.upiScanner}>
                            <h4>Or scan QR code</h4>
                            <div style={styles.qrPlaceholder}>
                                <div style={styles.qrIcon}>📱</div>
                                <p>Scan UPI QR Code</p>
                            </div>
                        </div>
                    </div>
                )}

                {paymentMethod === 'UPI' && (
                    <div style={styles.upiDetails}>
                        <h3>UPI Details</h3>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>UPI ID</label>
                            <input
                                type="text"
                                placeholder="yourname@upi"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.upiScanner}>
                            <h4>Or scan QR code</h4>
                            <img
                                src={qrCodeImage}
                                alt="UPI QR Code"
                                style={styles.qrCode}
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={handlePayment}
                    disabled={processing}
                    style={styles.payButton}
                >
                    {processing ? 'Processing...' : `Pay ₹${(booking?.service_detail?.price || booking?.service_price || booking?.service_total || '0')}`}
                </button>
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem',
    },
    paymentCard: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    title: {
        fontSize: '1.8rem',
        color: '#2c3e50',
        marginBottom: '1.5rem',
        textAlign: 'center',
    },
    bookingInfo: {
        backgroundColor: '#f8f9fa',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
    },
    amountInfo: {
        backgroundColor: '#e8f5e8',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        textAlign: 'center',
    },
    amount: {
        fontSize: '2rem',
        fontWeight: 'bold',
        color: '#27ae60',
        margin: '0.5rem 0',
    },
    paymentMethods: {
        marginBottom: '1.5rem',
    },
    methodOptions: {
        display: 'grid',
        gap: '1rem',
    },
    methodOption: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        margin: 0,
    },
    radioButton: {
        marginRight: '1rem',
        width: '18px',
        height: '18px',
    },
    methodCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        flex: 1,
    },
    methodIcon: {
        fontSize: '2rem',
    },
    cardDetails: {
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
    },
    upiDetails: {
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
    },
    formGroup: {
        marginBottom: '1rem',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    label: {
        display: 'block',
        marginBottom: '0.5rem',
        fontWeight: '500',
        color: '#2c3e50',
    },
    input: {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
    },
    upiScanner: {
        marginTop: '1rem',
        textAlign: 'center',
    },
    qrPlaceholder: {
        border: '2px dashed #ccc',
        padding: '2rem',
        borderRadius: '8px',
        backgroundColor: '#f8f9fa',
        cursor: 'pointer',
    },
    qrIcon: {
        fontSize: '3rem',
        marginBottom: '0.5rem',
    },
    qrCode: {
        width: '200px',
        height: '200px',
        margin: '1rem auto',
        border: '2px solid #ddd',
        borderRadius: '8px',
        padding: '10px',
        backgroundColor: 'white',
        display: 'block',
    },
    payButton: {
        width: '100%',
        padding: '1rem 2rem',
        backgroundColor: '#27ae60',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '1rem',
    },
    loading: {
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.2rem',
        color: '#7f8c8d',
    },
    error: {
        textAlign: 'center',
        padding: '2rem',
        fontSize: '1.2rem',
        color: '#e74c3c',
    },
};

export default PaymentPage;