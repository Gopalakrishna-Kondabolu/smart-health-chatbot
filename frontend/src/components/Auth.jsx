import React, { useState } from "react";
import { login, signup } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const Auth = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await login({ email, password });
        localStorage.setItem("token", res.data.token);
        setIsAuthenticated(true);
        navigate("/chatbot");
      } else {
        await signup({ fullName, email, password, age, gender });
        alert("Signup successful! Please login.");
        setIsLogin(true);
        setFullName("");
        setEmail("");
        setPassword("");
        setAge("");
        setGender("");
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Try again!";
      alert(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {isLogin ? "Welcome Back" : "Join Smart Healthcare"}
        </h2>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name field only for Signup */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="auth-input"
            />
          )}

          {/* Email */}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input"
          />

          {/* Age & Gender only for Signup */}
          {!isLogin && (
            <>
              <input
                type="number"
                placeholder="Enter your age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="auth-input"
              />

              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                required
                className="auth-input"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </>
          )}

          <button type="submit" className="auth-btn">
            {isLogin ? "Login" : "Signup"}
          </button>
        </form>

        <p className="auth-toggle">
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Create one" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
