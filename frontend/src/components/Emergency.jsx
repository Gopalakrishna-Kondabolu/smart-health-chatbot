import React, { useState } from "react";
import "../styles.css";

const Emergency = () => {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendLocation = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("You are not logged in. Please login first.");
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    if (!window.confirm("Are you sure you want to send your live location to an ambulance?")) return;

    setLoading(true);
    setStatus("");
    setError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch("http://localhost:5000/api/emergency", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ latitude, longitude }),
          });

          const data = await res.json();

          if (res.ok) {
            setStatus(data.message || "Location sent successfully ✅");
            setError("");
          } else {
            setError(data.message || "Failed to send location");
            setStatus("");
          }
        } catch (err) {
          setError("Error sending location");
          setStatus("");
          console.error(err);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Unable to retrieve your location");
        setStatus("");
        setLoading(false);
      }
    );
  };

  return (
    <div className="emergency-container">
      <h2>Emergency Help</h2>
      <p>Click the button below to send your live location to an ambulance.</p>
      <button
        className="emergency-btn"
        onClick={sendLocation}
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Location"}
      </button>
      {status && <p className="status-text">{status}</p>}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default Emergency;
