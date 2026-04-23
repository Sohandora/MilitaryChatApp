const express = require('express');
const router = express.Router();
const SOS = require('../models/SOS');
const { verifyToken, verifyCommander } = require('../middleware/authMiddleware');

// ── TRIGGER SOS (Soldier) ──
router.post('/trigger', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;

    const sos = new SOS({
      soldierName: req.user.name,
      soldierServiceId: req.user.id,
      unit: req.user.unit,
      message: message || '🚨 EMERGENCY — SOLDIER NEEDS IMMEDIATE ASSISTANCE'
    });

    await sos.save();
    res.status(201).json({ message: '✅ SOS triggered!', sos });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── GET ALL ACTIVE SOS (Commander only) ──
router.get('/active', verifyCommander, async (req, res) => {
  try {
    const alerts = await SOS.find({ isResolved: false })
      .sort({ createdAt: -1 });
    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

// ── GET ALL SOS HISTORY (Commander only) ──
router.get('/history', verifyCommander, async (req, res) => {
  try {
    const alerts = await SOS.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

// ── RESOLVE SOS (Commander only) ──
router.put('/resolve/:sosId', verifyCommander, async (req, res) => {
  try {
    const sos = await SOS.findByIdAndUpdate(
      req.params.sosId,
      {
        isResolved: true,
        resolvedBy: req.user.name
      },
      { new: true }
    );

    if (!sos) {
      return res.status(404).json({ message: '❌ SOS not found.' });
    }

    res.status(200).json({
      message: `✅ SOS resolved by ${req.user.name}`,
      sos
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

module.exports = router;