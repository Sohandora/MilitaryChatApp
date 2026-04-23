import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import BASE_URL from "../config";

export default function CommanderDashboard({ setPage, setActiveChannel }) {
  const [soldiers, setSoldiers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [memberServiceId, setMemberServiceId] = useState("");

  const socketRef = useRef(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSoldiers();
    fetchChannels();
    fetchSosAlerts();

    socketRef.current = io(BASE_URL, {
      transports: ["websocket", "polling"]
    });

    socketRef.current.on("receive_sos", (sos) => {
      setSosAlerts(prev => [sos, ...prev]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const fetchSoldiers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/soldiers`, {
        headers: { authorization: token }
      });
      const data = await res.json();
      if (!res.ok) { setIsError(true); setMessage(data.message); return; }
      setSoldiers(data);
    } catch {
      setIsError(true);
      setMessage("❌ Failed to load soldiers.");
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/channels/all`, {
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

  const fetchSosAlerts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/sos/active`, {
        headers: { authorization: token }
      });
      const data = await res.json();
      if (!res.ok) { setIsError(true); setMessage(data.message); return; }
      setSosAlerts(data);
    } catch {
      setIsError(true);
      setMessage("❌ Failed to load SOS alerts.");
    }
  };

  const handleResolveSOSAlert = async (sosId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/sos/resolve/${sosId}`, {
        method: "PUT",
        headers: { authorization: token }
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message);
      setSosAlerts(prev => prev.filter(s => s._id !== sosId));
    } catch {
      setIsError(true);
      setMessage("❌ Failed to resolve SOS.");
    }
  };

  const handleCreateChannel = async () => {
    if (!channelName.trim()) {
      setIsError(true);
      setMessage("❌ Channel name is required.");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/channels/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({ name: channelName, description: channelDesc })
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message);
      setChannelName("");
      setChannelDesc("");
      fetchChannels();
    } catch {
      setIsError(true);
      setMessage("❌ Failed to create channel.");
    }
  };

  const handleAddMember = async () => {
    if (!selectedChannel || !memberServiceId.trim()) {
      setIsError(true);
      setMessage("❌ Select a channel and enter Service ID.");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/channels/add-member`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          serviceId: memberServiceId
        })
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message);
      setMemberServiceId("");
      fetchChannels();
    } catch {
      setIsError(true);
      setMessage("❌ Failed to add member.");
    }
  };

  const handleDeleteChannel = async (channelId, name) => {
    if (!window.confirm(`Delete channel "${name}"?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/channels/delete/${channelId}`, {
        method: "DELETE",
        headers: { authorization: token }
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message);
      fetchChannels();
    } catch {
      setIsError(true);
      setMessage("❌ Failed to delete channel.");
    }
  };

  const activateKillSwitch = async (serviceId, name) => {
    if (!window.confirm(`🔴 Activate Kill Switch for ${name}?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/api/admin/killswitch/${serviceId}`, {
        method: "PUT",
        headers: { authorization: token }
      });
      const data = await res.json();
      setIsError(!res.ok);
      setMessage(data.message);
      fetchSoldiers();
    } catch {
      setIsError(true);
      setMessage("❌ Kill Switch failed.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="dashboardPage">
      {/* TOP BAR */}
      <div className="dashboardBar">
        <div className="dashboardBarLeft">
          <span className="dashIcon">⚔</span>
          <span className="dashTitle">COMMANDER DASHBOARD</span>
        </div>
        <div className="dashboardBarRight">
          {sosAlerts.length > 0 && (
            <span className="sosBadge">
              🚨 {sosAlerts.length} SOS ACTIVE
            </span>
          )}
          <span className="dashUser">CMD. {user?.name} | {user?.unit}</span>
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

        {/* UNIT OVERVIEW */}
        <div className="dashPanel">
          <div className="panelTitle">📊 UNIT OVERVIEW</div>
          <div className="statRow">
            <span className="statLabel">TOTAL SOLDIERS</span>
            <span className="statValue">{soldiers.length}</span>
          </div>
          <div className="statRow">
            <span className="statLabel">ACTIVE</span>
            <span className="statValue green">
              {soldiers.filter(s => !s.deviceWiped).length}
            </span>
          </div>
          <div className="statRow">
            <span className="statLabel">WIPED DEVICES</span>
            <span className="statValue red">
              {soldiers.filter(s => s.deviceWiped).length}
            </span>
          </div>
          <div className="statRow">
            <span className="statLabel">TOTAL CHANNELS</span>
            <span className="statValue">{channels.length}</span>
          </div>
          <div className="statRow">
            <span className="statLabel">ACTIVE SOS</span>
            <span className={`statValue ${sosAlerts.length > 0 ? "red" : "green"}`}>
              {sosAlerts.length}
            </span>
          </div>
        </div>

        {/* SOS ALERTS PANEL */}
        <div className={`dashPanel ${sosAlerts.length > 0 ? "sosActivePanel" : ""}`}>
          <div className="panelTitle">
            🚨 SOS ALERTS
            {sosAlerts.length > 0 && (
              <span className="sosBadge" style={{ marginLeft: "10px" }}>
                {sosAlerts.length} ACTIVE
              </span>
            )}
          </div>
          {sosAlerts.length === 0 ? (
            <p className="emptyText">No active SOS alerts.</p>
          ) : (
            sosAlerts.map(sos => (
              <div className="sosAlertRow" key={sos._id}>
                <div className="sosAlertIcon">🚨</div>
                <div className="sosAlertInfo">
                  <span className="sosAlertName">{sos.soldierName}</span>
                  <span className="sosAlertMeta">
                    {sos.unit} | {formatTime(sos.createdAt)}
                  </span>
                  <span className="sosAlertMessage">{sos.message}</span>
                </div>
                <button
                  className="sosResolveBtn"
                  onClick={() => handleResolveSOSAlert(sos._id)}
                >
                  RESOLVE
                </button>
              </div>
            ))
          )}
        </div>

        {/* CREATE CHANNEL */}
        <div className="dashPanel">
          <div className="panelTitle">📡 CREATE MISSION CHANNEL</div>
          <div className="label">CHANNEL NAME</div>
          <input
            className="input"
            placeholder="e.g. Operation Thunder"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
          />
          <div className="label">DESCRIPTION</div>
          <input
            className="input"
            placeholder="e.g. Northern border patrol"
            value={channelDesc}
            onChange={e => setChannelDesc(e.target.value)}
          />
          <button className="loginBtn fullWidth" onClick={handleCreateChannel}>
            CREATE CHANNEL
          </button>
        </div>

        {/* ADD MEMBER */}
        <div className="dashPanel">
          <div className="panelTitle">➕ ASSIGN SOLDIER TO CHANNEL</div>
          <div className="label">SELECT CHANNEL</div>
          <select
            className="input"
            value={selectedChannel}
            onChange={e => setSelectedChannel(e.target.value)}
          >
            <option value="">-- Select Channel --</option>
            {channels.map(ch => (
              <option key={ch._id} value={ch._id}>{ch.name}</option>
            ))}
          </select>
          <div className="label">SOLDIER SERVICE ID</div>
          <input
            className="input"
            placeholder="e.g. INDIA-5-441"
            value={memberServiceId}
            onChange={e => setMemberServiceId(e.target.value)}
          />
          <button className="loginBtn fullWidth" onClick={handleAddMember}>
            ASSIGN SOLDIER
          </button>
        </div>

        {/* KILL SWITCH */}
        <div className="dashPanel">
          <div className="panelTitle">🔴 KILL SWITCH — REMOTE WIPE</div>
          {soldiers.length === 0 && (
            <p className="emptyText">No soldiers registered yet.</p>
          )}
          {soldiers.map(soldier => (
            <div className="soldierRow" key={soldier._id}>
              <div className="soldierInfo">
                <span className="soldierName">{soldier.name}</span>
                <span className="soldierMeta">
                  {soldier.serviceId} | {soldier.unit}
                </span>
              </div>
              <div className="soldierActions">
                <span className={`statusBadge ${soldier.deviceWiped ? "wiped" : "active"}`}>
                  {soldier.deviceWiped ? "WIPED" : "ACTIVE"}
                </span>
                {!soldier.deviceWiped && (
                  <button
                    className="wipeBtn"
                    onClick={() => activateKillSwitch(
                      soldier.serviceId, soldier.name
                    )}
                  >
                    WIPE
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ALL MISSION CHANNELS */}
        <div className="dashPanel" style={{ gridColumn: "1 / -1" }}>
          <div className="panelTitle">📋 ALL MISSION CHANNELS</div>
          {channels.length === 0 && (
            <p className="emptyText">No channels created yet.</p>
          )}
          {channels.map(ch => (
            <div className="channelRow" key={ch._id}>
              <div className="channelInfo">
                <span className="channelName">📡 {ch.name}</span>
                <span className="channelMeta">
                  {ch.description} | Created by: {ch.createdBy} |
                  Members: {ch.members.length}
                </span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
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
                <button
                  className="wipeBtn"
                  onClick={() => handleDeleteChannel(ch._id, ch.name)}
                >
                  DELETE
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}