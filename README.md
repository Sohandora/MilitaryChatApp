# ⚔ Military Chat Application

A secure, real-time communication system designed for tactical military operations. Built with the MERN stack and Socket.io.

---

## 🛡 Features

### Module 1 — Secure Entry & Command Dashboard
- Soldier & Commander registration with rank verification
- JWT-based authentication
- Role-based dashboards (Commander vs Soldier view)
- Encrypted password storage with bcryptjs

### Module 2 — Mission Channels & Hierarchy
- Commanders can create Mission Channels
- Assign/remove soldiers from channels
- Soldiers only see their assigned channels
- Strict chain-of-command access control

### Module 3 — Tactical Communication
- Real-time messaging with Socket.io
- Persistent chat history stored in MongoDB
- Rank-based message styling
- Read receipts for Commander orders

### Module 4 — Field Security
- 🔥 Burn-on-Read messages (auto-delete after set time)
- 🔴 Kill Switch — Commander can remotely wipe a soldier's device
- Burn timer options: 10s, 30s, 1min, 5min, 1hr

### Module 5 — Emergency SOS
- One-tap SOS alert from Soldier dashboard
- Real-time alert delivered to Commander instantly
- Commander can resolve/dismiss alerts
- SOS history stored in database

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Real-time | Socket.io |
| Authentication | JWT + bcryptjs |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure
