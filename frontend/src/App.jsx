import React, { useState } from "react";
import Home from "./components/Home";
import Auth from "./components/Auth";
import CommanderDashboard from "./components/CommanderDashboard";
import SoldierDashboard from "./components/SoldierDashboard";
import ChatRoom from "./components/ChatRoom";
import "./App.css";

export default function App() {
  const [page, setPage] = useState(() => {
    const path = window.location.pathname;
    if (path === "/commander") return "commander";
    if (path === "/soldier") return "soldier";
    return "home";
  });
  const [mode, setMode] = useState("login");
  const [activeChannel, setActiveChannel] = useState(null);

  return (
    <div className="app">
      <div className="warning">⚠ MILITARY CHAT APPLICATION — CLASSIFIED SYSTEM</div>

      {page === "home" && <Home setPage={setPage} setMode={setMode} />}
      {page === "auth" && <Auth page={page} setPage={setPage} mode={mode} setMode={setMode} />}
      {page === "commander" && (
        <CommanderDashboard
          setPage={setPage}
          setActiveChannel={setActiveChannel}
        />
      )}
      {page === "soldier" && (
        <SoldierDashboard
          setPage={setPage}
          setActiveChannel={setActiveChannel}
        />
      )}
      {page === "chat" && activeChannel && (
        <ChatRoom
          channel={activeChannel}
          setPage={setPage}
        />
      )}
    </div>
  );
}