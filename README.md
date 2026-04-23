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
---

## ⚙ Local Setup

### Prerequisites
- Node.js
- MongoDB Atlas account
- Git

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/military-chat-app.git
cd military-chat-app
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `.env` file in `backend/`:

PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_secret_key
Start backend:
```bash
node server.js
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Deployment

| Service | URL |
|---|---|
| Frontend | https://your-app.vercel.app |
| Backend | https://your-app.onrender.com |

---

## 👥 Team

| Member | Role |
|---|---|
| Sohan Dora (CST-A1 06) | Auth, Chain-of-Command, Kill Switch, Dashboards |
| Swasti Prajnya Dash (CST-A1 14) | Chat, SOS, Burn-on-Read |

---

## 📸 Modules Overview

| Module | Feature | Status |
|---|---|---|
| Module 1 | Secure Entry & Dashboard | ✅ |
| Module 2 | Mission Channels & Hierarchy | ✅ |
| Module 3 | Real-Time Chat | ✅ |
| Module 4 | Burn-on-Read & Kill Switch | ✅ |
| Module 5 | Emergency SOS | ✅ |

---

## 🔐 Security Features

- Passwords encrypted with **bcryptjs**
- Authentication via **JWT tokens** (8hr expiry)
- Role-based route protection on all APIs
- Kill Switch wipes device on capture
- Burn-on-Read leaves no message trace
- MongoDB Atlas cloud storage with restricted access

---


