import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import BASE_URL from "../config";

export default function ChatRoom({ channel, setPage }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isBurnMode, setIsBurnMode] = useState(false);
  const [burnSeconds, setBurnSeconds] = useState(10);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const isCommander = user.rank === "Commander";

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(BASE_URL, {
      transports: ["websocket", "polling"]
    });

    socketRef.current.emit("join_channel", channel._id);
    fetchMessages();

    socketRef.current.on("receive_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socketRef.current.on("burn_message", ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    });

    return () => {
      socketRef.current.emit("leave_channel", channel._id);
      socketRef.current.disconnect();
    };
  }, [channel._id]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Client-side burn timer
  useEffect(() => {
    const timers = [];
    messages.forEach(msg => {
      if (msg.burnAfter) {
        const remaining = new Date(msg.burnAfter) - Date.now();
        if (remaining > 0) {
          const timer = setTimeout(() => {
            setMessages(prev => prev.filter(m => m._id !== msg._id));
          }, remaining);
          timers.push(timer);
        } else {
          setMessages(prev => prev.filter(m => m._id !== msg._id));
        }
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [messages.length]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/messages/${channel._id}`,
        { headers: { authorization: token } }
      );
      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setAlertMessage(data.message);
        return;
      }
      setMessages(data);
    } catch {
      setIsError(true);
      setAlertMessage("❌ Failed to load messages.");
    }
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;

    if (isBurnMode && isCommander) {
      socketRef.current.emit("send_burn_message", {
        channelId: channel._id,
        senderId: user.serviceId,
        senderName: user.name,
        senderRank: user.rank,
        text: newMessage,
        burnSeconds
      });
    } else {
      socketRef.current.emit("send_message", {
        channelId: channel._id,
        senderId: user.serviceId,
        senderName: user.name,
        senderRank: user.rank,
        text: newMessage
      });
    }

    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getBurnTimeLeft = (burnAfter) => {
    const remaining = Math.ceil((new Date(burnAfter) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div className="chatPage">
      {/* CHAT HEADER */}
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <button
            className="backBtn"
            onClick={() => setPage(isCommander ? "commander" : "soldier")}
          >
            ← BACK
          </button>
          <div>
            <div className="chatChannelName">📡 {channel.name}</div>
            <div className="chatChannelDesc">{channel.description}</div>
          </div>
        </div>
        <div className="chatHeaderRight">
          <span className="dashUser">
            {isCommander ? "⚔" : "🪖"} {user.name}
          </span>
        </div>
      </div>

      {/* ALERT */}
      {alertMessage && (
        <div className={`dashAlert ${isError ? "dashAlertError" : "dashAlertSuccess"}`}>
          {alertMessage}
        </div>
      )}

      {/* MESSAGES */}
      <div className="chatMessages">
        {messages.length === 0 && (
          <div className="emptyChat">
            No messages yet. Send the first message.
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === user.serviceId;
          const isCommanderMsg = msg.senderRank === "Commander";
          const isBurnMsg = msg.burnAfter !== null;

          return (
            <div
              key={msg._id}
              className={`messageBubble ${isMine ? "mine" : "theirs"}
                ${isCommanderMsg ? "commanderMsg" : ""}
                ${isBurnMsg ? "burnMsg" : ""}`}
            >
              {!isMine && (
                <div className="msgSender">
                  {isCommanderMsg ? "⚔" : "🪖"} {msg.senderName}
                  {isCommanderMsg && (
                    <span className="commanderTag">COMMANDER</span>
                  )}
                </div>
              )}

              {isBurnMsg && (
                <div className="burnIndicator">
                  🔥 BURN MESSAGE — {getBurnTimeLeft(msg.burnAfter)}s remaining
                </div>
              )}

              <div className="msgText">{msg.text}</div>
              <div className="msgTime">{formatTime(msg.createdAt)}</div>

              {isCommanderMsg && isMine && (
                <div className="readReceipts">
                  👁 Read by {msg.readBy.length - 1} soldier(s)
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* BURN MODE TOGGLE — Commander only */}
      {isCommander && (
        <div className="burnToolbar">
          <button
            className={`burnToggleBtn ${isBurnMode ? "burnActive" : ""}`}
            onClick={() => setIsBurnMode(!isBurnMode)}
          >
            🔥 {isBurnMode ? "BURN MODE ON" : "BURN MODE OFF"}
          </button>

          {isBurnMode && (
            <div className="burnTimerSelect">
              <span className="burnLabel">AUTO-DELETE AFTER:</span>
              <select
                className="burnSelect"
                value={burnSeconds}
                onChange={e => setBurnSeconds(Number(e.target.value))}
              >
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
                <option value={60}>1 minute</option>
                <option value={300}>5 minutes</option>
                <option value={3600}>1 hour</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* INPUT */}
      <div className="chatInput">
        <input
          className={`chatInputField ${isBurnMode ? "burnInputField" : ""}`}
          placeholder={isBurnMode
            ? `🔥 Burn message (auto-deletes in ${burnSeconds}s)...`
            : "Type your message..."
          }
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={`sendBtn ${isBurnMode ? "burnSendBtn" : ""}`}
          onClick={handleSend}
        >
          {isBurnMode ? "🔥 SEND" : "SEND ▶"}
        </button>
      </div>
    </div>
  );
}