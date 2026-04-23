const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const User = require('../models/User');
const { verifyToken, verifyCommander } = require('../middleware/authMiddleware');

// ── CREATE CHANNEL (Commander only) ──
router.post('/create', verifyCommander, async (req, res) => {
  try {
    const { name, description } = req.body;

    const channel = new Channel({
      name,
      description,
      createdBy: req.user.name,
      members: []
    });

    await channel.save();
    res.status(201).json({ message: '✅ Channel created!', channel });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── GET ALL CHANNELS (Commander only) ──
router.get('/all', verifyCommander, async (req, res) => {
  try {
    const channels = await Channel.find({ isActive: true });
    res.status(200).json(channels);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

// ── GET MY CHANNELS (Soldier) ──
router.get('/mine', verifyToken, async (req, res) => {
  try {
    const channels = await Channel.find({
      members: req.user.id,
      isActive: true
    });
    res.status(200).json(channels);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

// ── ADD SOLDIER TO CHANNEL (Commander only) ──
router.put('/add-member', verifyCommander, async (req, res) => {
  try {
    const { channelId, serviceId } = req.body;

    // Check soldier exists
    const soldier = await User.findOne({ serviceId, rank: 'Soldier' });
    if (!soldier) {
      return res.status(404).json({ message: '❌ Soldier not found.' });
    }

    // Check already a member
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: '❌ Channel not found.' });
    }

    if (channel.members.includes(soldier._id.toString())) {
      return res.status(400).json({ message: '⚠ Soldier already in channel.' });
    }

    channel.members.push(soldier._id.toString());
    await channel.save();

    res.status(200).json({ message: `✅ ${soldier.name} added to ${channel.name}` });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── REMOVE SOLDIER FROM CHANNEL (Commander only) ──
router.put('/remove-member', verifyCommander, async (req, res) => {
  try {
    const { channelId, serviceId } = req.body;

    const soldier = await User.findOne({ serviceId, rank: 'Soldier' });
    if (!soldier) {
      return res.status(404).json({ message: '❌ Soldier not found.' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: '❌ Channel not found.' });
    }

    channel.members = channel.members.filter(
      m => m !== soldier._id.toString()
    );
    await channel.save();

    res.status(200).json({ message: `✅ ${soldier.name} removed from ${channel.name}` });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── DELETE CHANNEL (Commander only) ──
router.delete('/delete/:channelId', verifyCommander, async (req, res) => {
  try {
    const channel = await Channel.findByIdAndUpdate(
      req.params.channelId,
      { isActive: false },
      { new: true }
    );

    if (!channel) {
      return res.status(404).json({ message: '❌ Channel not found.' });
    }

    res.status(200).json({ message: `✅ Channel "${channel.name}" deleted.` });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

module.exports = router;