const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyCommander } = require('../middleware/authMiddleware');

// Get all soldiers (Commander only)
router.get('/soldiers', verifyCommander, async (req, res) => {
  try {
    const soldiers = await User.find({ rank: 'Soldier' })
      .select('-password');  // Never send passwords
    res.status(200).json(soldiers);
  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

// KILL SWITCH — Wipe a soldier's device (Commander only)
router.put('/killswitch/:serviceId', verifyCommander, async (req, res) => {
  try {
    const { serviceId } = req.params;

    const soldier = await User.findOneAndUpdate(
      { serviceId },
      { deviceWiped: true, isActive: false },
      { new: true }
    );

    if (!soldier) {
      return res.status(404).json({ message: '❌ Soldier not found.' });
    }

    res.status(200).json({ 
      message: `🔴 Kill Switch activated for ${soldier.name}` 
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error' });
  }
});

module.exports = router;