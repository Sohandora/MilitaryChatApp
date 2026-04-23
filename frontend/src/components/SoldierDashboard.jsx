import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

export default function SoldierDashboard({ setPage, setActiveChannel }) {
  const [channels, setChannels] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [sosLoading, setSosLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchMyChannels();
  }, []);

  const fetchMyChannels = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/channels/mine", {
        headers: { authorization: token }
      });
      const data = await res.json();
      if (!res.ok) { setIsError(true); setMessage(data.message); return; }
      setChannels(data);
    } catch {
      setIsError(true);
      setMessage("❌ Failed to load channels.");
    }
  };

  // ── TRIGGER SOS ──
  const handleSOS = async () => {
    if (!window.confirm("🚨 TRIGGER EMERGENCY SOS ALERT?\nThis will immediately alert your Commander!")) return;

    setSosLoading(true);
    try {
      // Save to DB via API
      const res = await fetch("http://localhost:5000/api/sos/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          message: "🚨 EMERGENCY — SOLDIER NEEDS IMMEDIATE ASSISTANCE"
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setMessage(data.message);
        setSosLoading(false);
        return;
      }

      // Also emit via socket for real-time alert
      socket.emit("trigger_sos", {
        soldierName: user.name,
        soldierServiceId: user.serviceId,
        unit: user.unit,
        message: "🚨 EMERGENCY — SOLDIER NEEDS IMMEDIATE ASSISTANCE"
      });

      setSosTriggered(true);
      setSosMessage("🚨 SOS ALERT SENT! Your Commander has been notified.");
      setIsError(false);
      setMessage("");

    } catch {
      setIsError(true);
      setMessage("❌ Failed to send SOS.");
    }
    setSosLoading(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="dashboardPage">
      {/* TOP BAR */}
      <div className="dashboardBar">
        <div className="dashboardBarLeft">
          <span className="dashIcon">🪖</span>
          <span className="dashTitle">SOLDIER DASHBOARD</span>
        </div>
        <div className="dashboardBarRight">
          <span className="dashUser">{user?.name} | {user?.unit}</span>
          <button className="wipeBtn" onClick={handleLogout}>LOGOUT</button>
        </div>
      </div>

      {/* ALERT */}
      {message && (
        <div className={`dashAlert ${isError ? "dashAlertError" : "dashAlertSuccess"}`}>
          {message}
        </div>
      )}

      <div className="dashGrid">

        {/* PROFILE */}
        <div className="dashPanel">
          <div className="panelTitle">👤 MY PROFILE</div>
          <div className="statRow">
            <span className="statLabel">NAME</span>
            <span className="statValue">{user?.name}</span>
          </div>
          <div className="statRow">
            <span className="statLabel">SERVICE ID</span>
            <span className="statValue">{user?.serviceId}</span>
          </div>
          <div className="statRow">
            <span className="statLabel">RANK</span>
            <span className="statValue green">SOLDIER</span>
          </div>
          <div className="statRow">
            <span className="statLabel">UNIT</span>
            <span className="statValue">{user?.unit}</span>
          </div>
          <div className="statRow">
            <span className="statLabel">MY CHANNELS</span>
            <span className="statValue">{channels.length}</span>
          </div>
        </div>

        {/* SOS PANEL */}
        <div className="dashPanel sosPanel">
          <div className="panelTitle">🚨 EMERGENCY ALERT</div>

          {sosTriggered ? (
            <div className="sosTriggeredBox">
              <div className="sosTriggeredIcon">🚨</div>
              <div className="sosTriggeredText">{sosMessage}</div>
              <div className="sosTriggeredSub">
                Stay calm. Help is on the way.
              </div>
              <button
                className="sosResetBtn"
                onClick={() => setSosTriggered(false)}
              >
                SEND ANOTHER ALERT
              </button>
            </div>
          ) : (
            <>
              <p className="sosWarningText">
                Press only in case of real emergency.
                This will immediately alert your entire unit and Commander.
              </p>
              <button
                className="sosBtn"
                onClick={handleSOS}
                disabled={sosLoading}
              >
                {sosLoading ? "SENDING..." : "🚨 SOS — EMERGENCY ALERT"}
              </button>
            </>
          )}
        </div>

        {/* MY CHANNELS */}
        <div className="dashPanel" style={{ gridColumn: "1 / -1" }}>
          <div className="panelTitle">📡 MY MISSION CHANNELS</div>
          {channels.length === 0 && (
            <p className="emptyText">
              No channels assigned yet. Contact your Commander.
            </p>
          )}
          {channels.map(ch => (
            <div className="channelRow" key={ch._id}>
              <div className="channelInfo">
                <span className="channelName">📡 {ch.name}</span>
                <span className="channelMeta">
                  {ch.description} | Created by: {ch.createdBy}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span className="statusBadge active">ACTIVE</span>
                <button
                  className="loginBtn"
                  style={{ padding: "6px 16px", marginTop: "0" }}
                  onClick={() => {
                    setActiveChannel(ch);
                    setPage("chat");
                  }}
                >
                  ENTER
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}