/**
 * Footer Component
 * Displays contact information and social links
 */
import React from "react";

function Footer() {
    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                <div style={styles.footerContent}>
                    <div style={styles.contactInfo}>
                        <h3 style={styles.heading}>Contact Us</h3>
                        <p style={styles.contactDetail}>📧 Email: info@homeserviceprovider.com</p>
                        <p style={styles.contactDetail}>📞 Phone: +91 98765 43210</p>
                        <p style={styles.contactDetail}>🏢 Address: 123 Service Street, City, State 123456</p>
                    </div>

                    <div style={styles.socialLinks}>
                        <h3 style={styles.heading}>Follow Us</h3>
                        <div style={styles.socialIcons}>
                            <a href="#" style={styles.socialIcon}> Facebook</a>
                            <a href="#" style={styles.socialIcon}> Twitter</a>
                            <a href="#" style={styles.socialIcon}> Instagram</a>
                        </div>
                    </div>

                    <div style={styles.quickLinks}>
                        <h3 style={styles.heading}>Quick Links</h3>
                        <ul style={styles.linksList}>
                            <li><a href="/" style={styles.link}>Home</a></li>
                            <li><a href="/about" style={styles.link}>About Us</a></li>
                            <li><a href="/services" style={styles.link}>Services</a></li>
                            <li><a href="/contact" style={styles.link}>Contact</a></li>
                        </ul>
                    </div>
                </div>

                <div style={styles.copyright}>
                    <p>&copy; {new Date().getFullYear()} Home Service Provider. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

const styles = {
    footer: {
        backgroundColor: "#2c3e50",
        color: "#ecf0f1",
        padding: "2rem 0 1rem",
        marginTop: "auto",
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "0 1rem",
    },
    footerContent: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "2rem",
        marginBottom: "1.5rem",
    },
    contactInfo: {
        marginBottom: "1rem",
    },
    heading: {
        color: "#3498db",
        marginBottom: "1rem",
        fontSize: "1.2rem",
    },
    contactDetail: {
        marginBottom: "0.5rem",
        fontSize: "0.9rem",
    },
    socialLinks: {
        marginBottom: "1rem",
    },
    socialIcons: {
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
    },
    socialIcon: {
        color: "#ecf0f1",
        textDecoration: "none",
        fontSize: "0.9rem",
        marginBottom: "0.5rem",
    },
    quickLinks: {
        marginBottom: "1rem",
    },
    linksList: {
        listStyle: "none",
        padding: 0,
        margin: 0,
    },
    link: {
        color: "#ecf0f1",
        textDecoration: "none",
        fontSize: "0.9rem",
        display: "block",
        marginBottom: "0.5rem",
    },
    copyright: {
        borderTop: "1px solid #34495e",
        paddingTop: "1rem",
        textAlign: "center",
        fontSize: "0.9rem",
        color: "#bdc3c7",
    },
};

export default Footer;