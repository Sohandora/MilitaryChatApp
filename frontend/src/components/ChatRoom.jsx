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
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const isCommander = user.rank === "Commander";

  useEffect(() => {
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // ── UPLOAD FILE ──
  const handleFileUpload = async (file) => {
    if (!file) return null;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE_URL}/api/upload/upload`, {
        method: "POST",
        headers: { authorization: token },
        body: formData
      });
      const data = await res.json();

      if (!res.ok) {
        setIsError(true);
        setAlertMessage(data.message || "❌ Upload failed.");
        setUploading(false);
        return null;
      }

      setUploading(false);
      return data;
    } catch {
      setIsError(true);
      setAlertMessage("❌ File upload failed.");
      setUploading(false);
      return null;
    }
  };

  // ── SEND MESSAGE ──
  const handleSend = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    let fileData = null;
    if (selectedFile) {
      fileData = await handleFileUpload(selectedFile);
      if (!fileData) return;
    }

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
        text: newMessage,
        fileUrl: fileData?.url || null,
        fileName: fileData?.originalName || null,
        fileType: fileData?.fileType || null
      });
    }

    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !selectedFile) handleSend();
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

  const isImageFile = (fileType) => fileType && fileType.startsWith("image/");

  const getFileIcon = (fileType) => {
    if (!fileType) return "📎";
    if (fileType.startsWith("image/")) return "🖼";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word")) return "📝";
    return "📎";
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

              {/* Text */}
              {msg.text && (
                <div className="msgText">{msg.text}</div>
              )}

{/* File */}
{msg && msg.fileUrl ? (
  <div className="msgFile">
    {msg.fileType && msg.fileType.startsWith("image/") ? (
      <a
        href={String(msg.fileUrl)}
        target="_blank"
        rel="noreferrer"
      >
        <img
          src={String(msg.fileUrl)}
          alt={msg.fileName ? String(msg.fileName) : "image"}
          className="msgImage"
        />
      </a>
    ) : (
      <a
        href={String(msg.fileUrl)}
        target="_blank"
        rel="noreferrer"
        className="msgFileLink"
      >
        {getFileIcon(msg.fileType)}{" "}
        {msg.fileName ? String(msg.fileName) : "file"}
      </a>
    )}
  </div>
) : null}

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

      {/* FILE PREVIEW */}
      {selectedFile && (
        <div className="filePreview">
          <span className="filePreviewName">
            {getFileIcon(selectedFile.type)} {selectedFile.name}
          </span>
          <button
            className="fileRemoveBtn"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="chatInput">
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.txt"
          onChange={e => setSelectedFile(e.target.files[0] || null)}
        />
        <button
          className="attachBtn"
          onClick={() => fileInputRef.current.click()}
          title="Attach file"
        >
          📎
        </button>
        <input
          className={`chatInputField ${isBurnMode ? "burnInputField" : ""}`}
          placeholder={
            uploading
              ? "⏳ Uploading file..."
              : isBurnMode
              ? `🔥 Burn message (auto-deletes in ${burnSeconds}s)...`
              : "Type your message..."
          }
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={uploading}
        />
        <button
          className={`sendBtn ${isBurnMode ? "burnSendBtn" : ""}`}
          onClick={handleSend}
          disabled={uploading}
        >
          {uploading ? "⏳" : isBurnMode ? "🔥 SEND" : "SEND ▶"}
        </button>
      </div>
    </div>
  );
}