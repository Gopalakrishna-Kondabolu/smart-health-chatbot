import React, { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <br /><br />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <br /><br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
