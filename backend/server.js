const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const channelRoutes = require('./routes/channelRoutes');
const messageRoutes = require('./routes/messageRoutes');
const Message = require('./models/Message');
const Channel = require('./models/Channel');
const sosRoutes = require('./routes/sosRoutes');
const SOS = require('./models/SOS');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:['https://military-chat-app.vercel.app'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "authorization"]
}));

// Handle preflight requests
app.options("/:any", cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sos', sosRoutes);

// ── SOCKET.IO ──
io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // Join a channel room
  socket.on('join_channel', (channelId) => {
    socket.join(channelId);
    console.log(`👥 Socket ${socket.id} joined channel: ${channelId}`);
  });

  // Leave a channel room
  socket.on('leave_channel', (channelId) => {
    socket.leave(channelId);
    console.log(`👋 Socket ${socket.id} left channel: ${channelId}`);
  });

  // Send a normal message
  socket.on('send_message', async (data) => {
    try {
      const { channelId, senderId, senderName, senderRank, text } = data;

      const channel = await Channel.findById(channelId);
      if (!channel) return;

      const message = new Message({
        channelId,
        senderId,
        senderName,
        senderRank,
        text,
        readBy: [senderId],
        burnAfter: null
      });

      await message.save();

      io.to(channelId).emit('receive_message', {
        _id: message._id,
        channelId,
        senderId,
        senderName,
        senderRank,
        text,
        readBy: message.readBy,
        burnAfter: null,
        createdAt: message.createdAt
      });

    } catch (err) {
      console.log('❌ Message error:', err.message);
    }
  });

  // Send a burn message
  socket.on('send_burn_message', async (data) => {
    try {
      const { channelId, senderId, senderName, senderRank, text, burnSeconds } = data;

      const channel = await Channel.findById(channelId);
      if (!channel) return;

      const burnAfter = new Date(Date.now() + burnSeconds * 1000);

      const message = new Message({
        channelId,
        senderId,
        senderName,
        senderRank,
        text,
        readBy: [senderId],
        burnAfter
      });

      await message.save();

      // Broadcast burn message to everyone in channel
      io.to(channelId).emit('receive_message', {
        _id: message._id,
        channelId,
        senderId,
        senderName,
        senderRank,
        text,
        readBy: message.readBy,
        burnAfter: message.burnAfter,
        createdAt: message.createdAt
      });

      // Auto delete from all screens after burnSeconds
      setTimeout(() => {
        io.to(channelId).emit('burn_message', { messageId: message._id });
      }, burnSeconds * 1000);

    } catch (err) {
      console.log('❌ Burn message error:', err.message);
    }
  });

  // ── SOS ALERT ──
  socket.on('trigger_sos', async (data) => {
    try {
      const { soldierName, soldierServiceId, unit, message } = data;

      const sos = new SOS({
        soldierName,
        soldierServiceId,
        unit,
        message: message || '🚨 EMERGENCY — SOLDIER NEEDS IMMEDIATE ASSISTANCE'
      });

      await sos.save();

      // Broadcast SOS to ALL connected commanders
      io.emit('receive_sos', {
        _id: sos._id.toString(),
        soldierName,
        soldierServiceId,
        unit,
        message: sos.message,
        createdAt: sos.createdAt
      });

      console.log(`🚨 SOS triggered by ${soldierName} from ${unit}`);

    } catch (err) {
      console.log('❌ SOS error:', err.message);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(process.env.PORT, () => {
      console.log(`✅ Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log('❌ DB Error:', err));