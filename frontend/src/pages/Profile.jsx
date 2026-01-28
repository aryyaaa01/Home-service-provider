/**
 * Profile Component
 * Allows users to view and update their profile information
 */
import React, { useState, useEffect } from "react";
import { useNotification } from "../hooks/useNotification";
import api from "../api";

function Profile() {
    const [profile, setProfile] = useState({
        username: "",
        email: "",
        phone_number: "",
        address: "",
        role: "",
        is_approved: false
    });
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = () => {
        api.get("profile/")
            .then((res) => {
                setProfile(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error loading profile:", err);
                showNotification("Failed to load profile.", "error");
                setLoading(false);
            });
    };

    const handleInputChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        setUpdating(true);

        api.put("profile/", profile)
            .then((res) => {
                showNotification("Profile updated successfully!", "success");
                setEditing(false);
            })
            .catch((err) => {
                console.error("Error updating profile:", err);
                const errorMsg = err.response?.data?.phone_number?.[0] ||
                    err.response?.data?.non_field_errors?.[0] ||
                    "Failed to update profile.";
                showNotification(errorMsg, "error");
            })
            .finally(() => {
                setUpdating(false);
            });
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.pageTitle}>My Profile</h1>
                <div style={styles.roleBadge}>
                    {profile.role === "USER" && "👤 User"}
                    {profile.role === "WORKER" && "👷 Worker"}
                    {profile.role === "ADMIN" && "👑 Admin"}
                </div>
            </div>

            <div style={styles.profileCard}>
                <div style={styles.profileHeader}>
                    <div style={styles.avatar}>
                        {profile.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.userInfo}>
                        <h2 style={styles.userName}>{profile.username}</h2>
                        <p style={styles.userEmail}>{profile.email}</p>
                        {profile.role === "WORKER" && (
                            <span style={{
                                ...styles.statusIndicator,
                                backgroundColor: profile.is_approved ? "#27ae60" : "#e74c3c",
                            }}>
                                {profile.is_approved ? "✓ Approved" : "⚠ Pending Approval"}
                            </span>
                        )}
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={handleUpdateProfile} style={styles.editForm}>
                        <div style={styles.formSection}>
                            <h3 style={styles.sectionTitle}>Contact Information</h3>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.modernLabel}>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleInputChange}
                                        required
                                        style={styles.modernInput}
                                        placeholder="your.email@example.com"
                                    />
                                </div>
                            </div>

                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.modernLabel}>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone_number"
                                        value={profile.phone_number}
                                        onChange={handleInputChange}
                                        required
                                        style={styles.modernInput}
                                        placeholder="+91 XXXXXXXXXX"
                                    />
                                </div>
                            </div>

                            {profile.role !== 'WORKER' && (
                                <div style={styles.formGroup}>
                                    <label style={styles.modernLabel}>Address</label>
                                    <textarea
                                        name="address"
                                        value={profile.address || ""}
                                        onChange={handleInputChange}
                                        style={styles.modernTextarea}
                                        rows="3"
                                        placeholder="Enter your full address"
                                    />
                                </div>
                            )}
                        </div>

                        <div style={styles.actionButtons}>
                            <button
                                type="submit"
                                disabled={updating}
                                style={styles.primaryButton}
                            >
                                {updating ? (
                                    <>
                                        <span style={styles.spinner}></span>
                                        Saving...
                                    </>
                                ) : "💾 Save Changes"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditing(false);
                                    loadProfile();
                                }}
                                style={styles.secondaryButton}
                            >
                                ✕ Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={styles.viewMode}>
                        <div style={styles.infoSection}>
                            <h3 style={styles.sectionTitle}>Personal Information</h3>

                            <div style={styles.infoGrid}>
                                <div style={styles.infoItem}>
                                    <span style={styles.infoLabel}>📧 Email</span>
                                    <span style={styles.infoValue}>{profile.email}</span>
                                </div>

                                <div style={styles.infoItem}>
                                    <span style={styles.infoLabel}>📱 Phone</span>
                                    <span style={styles.infoValue}>
                                        {profile.phone_number || (
                                            <span style={styles.missingInfo}>Not provided</span>
                                        )}
                                    </span>
                                </div>

                                {profile.role !== 'WORKER' && (
                                    <div style={styles.infoItem}>
                                        <span style={styles.infoLabel}>📍 Address</span>
                                        <span style={styles.infoValue}>
                                            {profile.address || (
                                                <span style={styles.missingInfo}>Not provided</span>
                                            )}
                                        </span>
                                    </div>
                                )}

                                <div style={styles.infoItem}>
                                    <span style={styles.infoLabel}>🔒 Account Type</span>
                                    <span style={styles.infoValue}>
                                        <span style={styles.roleTag}>{profile.role}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setEditing(true)}
                            style={styles.editProfileButton}
                        >
                            ✏️ Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "2rem",
    },
    header: {
        textAlign: "center",
        marginBottom: "1.5rem",
    },
    pageTitle: {
        fontSize: "2rem",
        color: "#333",
        margin: 0,
    },
    roleBadge: {
        display: "block",
        marginTop: "0.5rem",
        padding: "0.3rem 0.8rem",
        backgroundColor: "#e0e0e0",
        color: "#666",
        borderRadius: "4px",
        fontSize: "0.9rem",
        width: "fit-content",
        margin: "0 auto",
    },
    profileCard: {
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        overflow: "hidden",
        backdropFilter: "blur(15px)",
    },
    profileHeader: {
        display: "flex",
        alignItems: "center",
        padding: "1.5rem",
        backgroundColor: "rgba(245, 245, 245, 0.5)",
        borderBottom: "1px solid #e0e0e0",
    },
    avatar: {
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        backgroundColor: "#2196F3",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.5rem",
        fontWeight: "bold",
        marginRight: "1rem",
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: "1.4rem",
        color: "#333",
        margin: "0 0 0.3rem 0",
    },
    userEmail: {
        fontSize: "1rem",
        color: "#666",
        margin: 0,
    },
    statusIndicator: {
        padding: "0.3rem 0.6rem",
        borderRadius: "4px",
        color: "white",
        fontSize: "0.8rem",
    },
    editForm: {
        padding: "1.5rem",
    },
    formSection: {
        marginBottom: "1.5rem",
    },
    sectionTitle: {
        fontSize: "1.3rem",
        color: "#333",
        marginBottom: "1rem",
        paddingBottom: "0.5rem",
        borderBottom: "1px solid #eee",
    },
    formRow: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "1rem",
        marginBottom: "1rem",
    },
    formGroup: {
        display: "flex",
        flexDirection: "column",
    },
    modernLabel: {
        marginBottom: "0.5rem",
        fontWeight: "500",
        color: "#555",
        fontSize: "1rem",
    },
    modernInput: {
        padding: "0.8rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        outline: "none",
        transition: "border-color 0.3s",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(5px)",
    },
    modernInputFocus: {
        borderColor: "#2196F3",
    },
    modernTextarea: {
        padding: "0.8rem",
        border: "1px solid #ddd",
        borderRadius: "4px",
        fontSize: "1rem",
        resize: "vertical",
        minHeight: "80px",
        outline: "none",
        transition: "border-color 0.3s",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(5px)",
    },
    actionButtons: {
        display: "flex",
        gap: "0.8rem",
        justifyContent: "flex-end",
        marginTop: "1.5rem",
        paddingTop: "1rem",
        borderTop: "1px solid #eee",
    },
    primaryButton: {
        padding: "0.8rem 1.5rem",
        backgroundColor: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "500",
        transition: "background-color 0.3s",
    },
    secondaryButton: {
        padding: "0.8rem 1.5rem",
        backgroundColor: "#f5f5f5",
        color: "#666",
        border: "1px solid #ddd",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "500",
        transition: "background-color 0.3s",
    },
    viewMode: {
        padding: "1.5rem",
    },
    infoSection: {
        marginBottom: "1.5rem",
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "0.8rem",
    },
    infoItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.8rem",
        borderBottom: "1px solid #eee",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(5px)",
    },
    infoLabel: {
        fontWeight: "500",
        color: "#555",
        fontSize: "1rem",
    },
    infoValue: {
        color: "#333",
        fontSize: "1rem",
    },
    missingInfo: {
        color: "#999",
        fontStyle: "italic",
    },
    roleTag: {
        padding: "0.3rem 0.8rem",
        backgroundColor: "#e0e0e0",
        color: "#666",
        borderRadius: "4px",
        fontWeight: "normal",
        fontSize: "0.9rem",
    },
    editProfileButton: {
        padding: "0.8rem 1.5rem",
        backgroundColor: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "1rem",
        fontWeight: "500",
        width: "100%",
        transition: "background-color 0.3s",
    },
};

export default Profile;