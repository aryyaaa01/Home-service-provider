import React, { useState } from 'react';
import api from '../api';

const RatingReview = ({ serviceId, bookingId, onRatingSubmit, compact = false }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                rating: rating,
                review: review
            };

            if (serviceId) {
                payload.service = serviceId;
            }
            if (bookingId) {
                payload.booking = bookingId;
            }

            console.log('Submitting rating with payload:', payload);
            const response = await api.post('/ratings/', payload);
            console.log('Rating submitted successfully:', response.data);

            // Show success message
            alert('Thank you for your rating and review!');

            setRating(0);
            setReview('');
            if (onRatingSubmit) {
                onRatingSubmit(response.data);
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
            let errorMessage = 'Error submitting rating: ';
            if (error.response?.data?.error) {
                errorMessage += error.response.data.error;
            } else if (error.response?.data?.detail) {
                errorMessage += error.response.data.detail;
            } else {
                errorMessage += error.message || 'Unknown error';
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const starStyle = {
        fontSize: compact ? '1.2rem' : '1.5rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        color: '#bdc3c7',
        border: 'none',
        background: 'transparent',
        outline: 'none',
        transition: 'color 0.2s',
    };

    const filledStarStyle = {
        ...starStyle,
        color: '#f39c12',
    };

    const formStyle = compact
        ? { maxWidth: '400px', margin: '1rem auto', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
        : { maxWidth: '500px', margin: '2rem auto', padding: '1.5rem', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };

    const textStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '1rem',
        resize: 'vertical',
        minHeight: '100px',
        fontFamily: 'inherit',
        marginTop: '1rem',
        marginBottom: '1rem',
    };

    const buttonStyle = {
        padding: '0.75rem 1.5rem',
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: loading || rating === 0 ? 'not-allowed' : 'pointer',
        fontSize: '1rem',
        opacity: loading || rating === 0 ? 0.6 : 1,
        transition: 'opacity 0.2s',
    };

    return (
        <div style={formStyle}>
            <h3 style={{ margin: 0, marginBottom: '1rem', color: '#2c3e50', fontSize: compact ? '1.1rem' : '1.3rem' }}>
                Rate this {bookingId ? 'booking' : 'service'}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        style={star <= (hover || rating) ? filledStarStyle : starStyle}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        disabled={loading}
                        aria-label={`Rate ${star} stars`}
                    >
                        ★
                    </button>
                ))}
                <span style={{ marginLeft: '0.5rem', color: '#7f8c8d', fontSize: '0.9rem' }}>
                    {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
                </span>
            </div>

            <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                style={textStyle}
                disabled={loading}
                aria-label="Review text"
            />

            <button
                type="submit"
                disabled={loading || rating === 0}
                style={buttonStyle}
                onClick={handleSubmit}
            >
                {loading ? 'Submitting...' : 'Submit Review'}
            </button>
        </div>
    );
};

export default RatingReview;