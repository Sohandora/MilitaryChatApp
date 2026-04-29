import React, { useState } from "react";
import BASE_URL from "../config";

export default function Auth({ setPage, mode, setMode }) {
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [loginData, setLoginData] = useState({ serviceId: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "", serviceId: "", password: "", rank: "Soldier", unit: "", accessCode: ""
  });

  // ── LOGIN ──
  const handleLogin = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.message || "❌ Login failed.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsError(false);
      setMessage(data.message);

      if (data.user.rank === "Commander") {
        window.location.href = "/commander";
      } else {
        window.location.href = "/soldier";
      }

    } catch (err) {
      setIsError(true);
      setMessage("❌ Server unreachable. Is backend running?");
    }
  };

  // ── REGISTER ──
 const handleRegister = async () => {
  // Validate Service ID format
  const serviceIdRegex = /^[A-Z]+-\d+-\d+$/;
  if (!serviceIdRegex.test(registerData.serviceId)) {
    setIsError(true);
    setMessage("❌ Invalid Service ID format.");
    return;
  }

  // Validate password length
  if (registerData.password.length < 6) {
    setIsError(true);
    setMessage("❌ Password must be at least 6 characters.");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData)
    });
    const data = await res.json();

    if (!res.ok) {
      setIsError(true);
      setMessage(data.message || "❌ Registration failed.");
      return;
    }

    setIsError(false);
    setMessage(data.message + " Please login.");
    setTimeout(() => { setMode("login"); setMessage(""); }, 2000);

  } catch (err) {
    setIsError(true);
    setMessage("❌ Server unreachable. Is backend running?");
  }
};

  return (
    <div className="loginCard">
      <div className="icon">🛡</div>
      <div className="title">SECURE ACCESS</div>
      <div className="subtitle">AUTHENTICATION REQUIRED</div>

      {/* ALERT */}
      {message && (
        <div style={{
          padding: "10px",
          marginBottom: "10px",
          borderRadius: "6px",
          fontSize: "12px",
          background: isError ? "#2b0f0f" : "#0f2b0f",
          color: isError ? "#ff4d4d" : "#6cff7c",
          border: `1px solid ${isError ? "#ff4d4d" : "#6cff7c"}`
        }}>
          {message}
        </div>
      )}

      {mode === "login" ? (
        <>
          <div className="label">SERVICE ID</div>
          <input
            className="input"
            placeholder="INDIA-7-992"
            value={loginData.serviceId}
            onChange={e => setLoginData({ ...loginData, serviceId: e.target.value })}
          />

          <div className="label">PASSWORD</div>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={loginData.password}
            onChange={e => setLoginData({ ...loginData, password: e.target.value })}
          />

          <button className="loginBtn fullWidth" onClick={handleLogin}>
            AUTHENTICATE
          </button>

          <div className="switchText">
            New Soldier?{" "}
            <span onClick={() => { setMode("register"); setMessage(""); }}>
              Register
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="label">NAME</div>
          <input
            className="input"
            placeholder="Your Name"
            onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
          />

          <div className="label">SERVICE ID</div>
          <input
            className="input"
            placeholder="INDIA-7-992"
            onChange={e => setRegisterData({ ...registerData, serviceId: e.target.value })}
          />

          <div className="label">PASSWORD</div>
          <input
            className="input"
            type="password"
            placeholder="Min 6 characters"
            onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
          />

          <div className="label">RANK</div>
          <select
            className="input"
            onChange={e => setRegisterData({ ...registerData, rank: e.target.value })}
          >
            <option value="Soldier">Soldier</option>
            <option value="Commander">Commander</option>
          </select>

          <div className="label">UNIT</div>
          <input
            className="input"
            placeholder="e.g. Alpha Squad"
            onChange={e => setRegisterData({ ...registerData, unit: e.target.value })}
          />

          <div className="label">ACCESS CODE</div>
          <input
            className="input"
            type="password"
            placeholder="Enter your clearance code"
            onChange={e => setRegisterData({ ...registerData, accessCode: e.target.value })}
          />
          <div style={{
            fontSize: "10px",
            color: "#4a7a4a",
            fontFamily: "'Share Tech Mono', monospace",
            marginTop: "4px",
            textAlign: "left"
          }}>
            ⚠ Contact your Commander for access code
          </div>

          <button className="loginBtn fullWidth" onClick={handleRegister}>
            REGISTER
          </button>

          <div className="switchText">
            Already registered?{" "}
            <span onClick={() => { setMode("login"); setMessage(""); }}>
              Login
            </span>
          </div>
        </>
      )}

      <div className="switchText">
        <span onClick={() => setPage("home")}>⬅ Back to Home</span>
      </div>

      <div className="footer">
        SYSTEM STATUS | <span className="green">READY</span>
      </div>
    </div>
  );
}