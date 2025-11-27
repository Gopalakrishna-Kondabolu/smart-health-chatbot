import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const HomePage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token"); // check if user is logged in

  // Pre-login actions
  const goToLogin = () => {
    navigate("/auth", { state: { mode: "login" } });
  };

  const goToSignup = () => {
    navigate("/auth", { state: { mode: "signup" } });
  };

  // Post-login actions
  const goToChatbot = () => {
    navigate("/chatbot");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="homepage">
      <div className="hero">
        <h1 className="glow-text">Welcome to Smart Healthcare Chatbot</h1>
        <p className="tagline">
          Your AI-powered health assistant — available 24/7.
        </p>

        <div className="buttons">
          {!token ? (
            // Pre-login buttons
            <>
              <button onClick={goToLogin} className="cta-btn">
                Login
              </button>
              <button onClick={goToSignup} className="cta-btn secondary">
                Sign Up
              </button>
            </>
          ) : (
            // Post-login buttons
            <>
              <button onClick={goToChatbot} className="cta-btn">
                Try Chatbot
              </button>
              <button onClick={goToDashboard} className="cta-btn secondary">
                View Dashboard
              </button>
            </>
          )}
        </div>
      </div>

      {/* Optional floating icons */}
      <div className="floating-icons">
        <span>💖</span>
        <span>💊</span>
        <span>🩺</span>
        <span>⚕️</span>
      </div>
    </div>
  );
};

export default HomePage;
