const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Channel = require('../models/Channel');
const { verifyToken } = require('../middleware/authMiddleware');

// ── GET ALL MESSAGES FOR A CHANNEL ──
router.get('/:channelId', verifyToken, async (req, res) => {
  try {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: '❌ Channel not found.' });
    }

    const isMember = channel.members.includes(req.user.id);
    const isCommander = req.user.rank === 'Commander';

    if (!isMember && !isCommander) {
      return res.status(403).json({
        message: '❌ Access denied. Not a member of this channel.'
      });
    }

    // Filter out burned messages
    const now = new Date();
    const messages = await Message.find({
      channelId,
      $or: [
        { burnAfter: null },
        { burnAfter: { $gt: now } }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── SEND BURN MESSAGE (Commander only) ──
router.post('/burn', verifyToken, async (req, res) => {
  try {
    if (req.user.rank !== 'Commander') {
      return res.status(403).json({ message: '❌ Commanders only.' });
    }

    const { channelId, text, burnSeconds } = req.body;

    const burnAfter = new Date(Date.now() + burnSeconds * 1000);

    const message = new Message({
      channelId,
      senderId: req.user.id,
      senderName: req.user.name,
      senderRank: req.user.rank,
      text,
      readBy: [req.user.id],
      burnAfter
    });

    await message.save();

    res.status(201).json({
      message: '✅ Burn message sent!',
      data: message
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── MARK MESSAGE AS READ ──
router.put('/read/:messageId', verifyToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: '❌ Message not found.' });
    }

    if (!message.readBy.includes(req.user.id)) {
      message.readBy.push(req.user.id);
      await message.save();
    }

    res.status(200).json({ message: '✅ Marked as read.' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

// ── DELETE EXPIRED BURN MESSAGES ──
router.delete('/cleanup', async (req, res) => {
  try {
    const now = new Date();
    const result = await Message.deleteMany({
      burnAfter: { $lte: now, $ne: null }
    });
    res.status(200).json({
      message: `✅ Cleaned up ${result.deletedCount} burned messages.`
    });
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

module.exports = router;