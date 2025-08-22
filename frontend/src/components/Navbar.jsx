import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav style={{ padding: "10px", backgroundColor: "#1976d2", color: "#fff" }}>
      <Link to="/" style={{ marginRight: "20px", color: "#fff", textDecoration: "none" }}>Home</Link>
      <Link to="/dashboard" style={{ marginRight: "20px", color: "#fff", textDecoration: "none" }}>Dashboard</Link>
      <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>Login</Link>
    </nav>
  );
};

export default Navbar;
