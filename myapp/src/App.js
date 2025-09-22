import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Homepage from "./Homepage";
import './App.css';

function LoginCard() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const BACKEND_URL = "http://127.0.0.1:8000/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      navigate("/home");
    } else {
      setError(data.detail || "Login failed");
    }
  };

  return (
    <div className="App" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)" }}>
      <div style={{
        background: "#fff",
        padding: "2.5rem 2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 24px rgba(25, 118, 210, 0.15)",
        minWidth: "340px",
        maxWidth: "90vw"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "2rem", color: "#1976d2", letterSpacing: "1px" }}>Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.2rem" }}>
            <input
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #bdbdbd",
                fontSize: "1rem",
                outline: "none",
                transition: "border 0.2s"
              }}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
          </div>
          <div style={{ marginBottom: "1.2rem" }}>
            <input
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "6px",
                border: "1px solid #bdbdbd",
                fontSize: "1rem",
                outline: "none",
                transition: "border 0.2s"
              }}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          {error && (
            <div style={{ color: "#d32f2f", marginBottom: "1rem", textAlign: "center" }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "6px",
              border: "none",
              background: "linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              cursor: "pointer",
              letterSpacing: "1px",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.10)"
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginCard />} />
        <Route path="/home" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
