import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles.css";

const Navbar = ({ token }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
    window.location.reload(); // optional, ensures HomePage re-renders
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/chatbot", label: "Chatbot" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo */}
        <div className="navbar-logo" onClick={() => navigate("/")}>
          💙 SmartCare
        </div>

        {/* Center: Nav Links */}
        {token && (
          <ul className="navbar-links">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={isActive(item.to) ? "active" : ""}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Right: Logout */}
        {token && (
          <div className="navbar-auth">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;