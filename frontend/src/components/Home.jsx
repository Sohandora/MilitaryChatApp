import React from "react";

export default function Home({ setPage, setMode }) {
  return (
    <div className="homePage">
      <div className="overlay"></div>
      <div className="scanlines"></div>

      <div className="hero">
        <div className="icon big">🛡</div>
        <div className="badge">SECURE CHANNEL ACTIVE</div>

        <h1 className="heroTitle">MILITARY COMMUNICATION SYSTEM</h1>

        <p className="heroText">
          Secure real-time communication platform designed for tactical operations.
          Ensures encrypted messaging, strict rank-based access, and emergency alerts.
        </p>

        <div className="features">
          <div className="feature">🔐 End-to-End Encryption</div>
          <div className="feature">🎖 Rank-Based Access</div>
          <div className="feature">⚡ Real-Time Chat</div>
          <div className="feature">🚨 SOS System</div>
          <div className="feature">💣 Kill Switch</div>
        </div>

        <div className="homeButtons">
          <button
            className="loginBtn"
            onClick={() => {
              setPage("auth");
              setMode("login");
            }}
          >
            LOGIN
          </button>

          <button
            className="secondaryBtn"
            onClick={() => {
              setPage("auth");
              setMode("register");
            }}
          >
            REGISTER
          </button>
        </div>

        <div className="statusBar">
          <span className="dot"></span> ENCRYPTION ACTIVE | 
          <span className="dot"></span> SERVER ONLINE | 
          <span className="dot"></span> SECURE CHANNEL
        </div>
      </div>
    </div>
  );
}