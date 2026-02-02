/**
 * Main App Component
 * Defines all routes for the application
 */
import React, { useState, createContext } from "react";
import backgroundImage from "./images/my-background.png";
import { Routes, Route } from "react-router-dom";
import NotificationPopup from "./components/NotificationPopup.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";
import WorkerDashboard from "./pages/WorkerDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import WorkerHome from "./pages/WorkerHome.jsx";
import AdminHome from "./pages/AdminHome.jsx";
import UserHome from "./pages/UserHome.jsx";
import OTPPage from "./pages/OTPPage.jsx";
import ServiceDetails from "./pages/ServiceDetails.jsx";
import Notifications from "./pages/Notifications.jsx";
import Earnings from "./pages/Earnings.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import BookingHistory from "./pages/BookingHistory.jsx";
import BookingDetails from "./pages/BookingDetails.jsx";
import RatingReviewPage from "./pages/RatingReviewPage.jsx";

// Create notification context
export const NotificationContext = createContext();

function App() {
    const [notification, setNotification] = useState(null);

    const showNotification = (message, type = "info") => {
        setNotification({ message, type });
    };

    const hideNotification = () => {
        setNotification(null);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            <div style={styles.app} className="app">
                <Navbar />
                <div style={styles.content}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/user-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["USER"]}>
                                    <UserDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/worker-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["WORKER"]}>
                                    <WorkerDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/worker-home"
                            element={
                                <ProtectedRoute allowedRoles={["WORKER"]}>
                                    <WorkerHome />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user-home"
                            element={
                                <ProtectedRoute allowedRoles={["USER"]}>
                                    <UserHome />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin-dashboard"
                            element={
                                <ProtectedRoute allowedRoles={["ADMIN"]}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin-home"
                            element={
                                <ProtectedRoute allowedRoles={["ADMIN"]}>
                                    <AdminHome />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute allowedRoles={["USER", "WORKER"]}>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/otp"
                            element={
                                <ProtectedRoute allowedRoles={["WORKER"]}>
                                    <OTPPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/service/:id"
                            element={<ServiceDetails />}
                        />
                        <Route
                            path="/notifications"
                            element={
                                <ProtectedRoute allowedRoles={["USER", "WORKER", "ADMIN"]}>
                                    <Notifications />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/earnings"
                            element={
                                <ProtectedRoute allowedRoles={["WORKER"]}>
                                    <Earnings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/payment/:bookingId"
                            element={
                                <ProtectedRoute allowedRoles={["USER"]}>
                                    <PaymentPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking-history"
                            element={
                                <ProtectedRoute allowedRoles={["USER"]}>
                                    <BookingHistory />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/booking-details/:id"
                            element={
                                <ProtectedRoute allowedRoles={["USER"]}>
                                    <BookingDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/rate-review/:bookingId"
                            element={
                                <ProtectedRoute allowedRoles={["USER"]}>
                                    <RatingReviewPage />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>

                {/* Notification Popup */}
                {notification && (
                    <NotificationPopup
                        message={notification.message}
                        type={notification.type}
                        onClose={hideNotification}
                    />
                )}
            </div>
        </NotificationContext.Provider>
    );
}

const styles = {
    app: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "contain",  // Changed from "cover" to "contain"
        backgroundPosition: "center top",  // Adjusted to show the top portion where the people's heads are
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",  // Fixed background to prevent scrolling
    },
    content: {
        flex: 1,
        padding: "2rem 0",
    },
};

export default App;