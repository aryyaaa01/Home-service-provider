import React, { useEffect } from "react";

function NotificationPopup({ message, type = "info", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyle = () => {
    const baseStyle = {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "15px 20px",
      borderRadius: "8px",
      color: "white",
      fontWeight: "500",
      zIndex: 10000,
      maxWidth: "400px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      animation: "slideIn 0.3s ease-out",
      cursor: "pointer",
    };

    switch (type) {
      case "success":
        return { ...baseStyle, backgroundColor: "#27ae60" };
      case "error":
        return { ...baseStyle, backgroundColor: "#e74c3c" };
      case "warning":
        return { ...baseStyle, backgroundColor: "#f39c12" };
      case "info":
      default:
        return { ...baseStyle, backgroundColor: "#3498db" };
    }
  };

  return (
    <div style={getStyle()} onClick={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{message}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default NotificationPopup;
