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

    console.log('🔴 Kill Switch triggered for:', serviceId);

    const soldier = await User.findOne({ serviceId });

    if (!soldier) {
      console.log('❌ Soldier not found:', serviceId);
      return res.status(404).json({ message: '❌ Soldier not found.' });
    }

    soldier.deviceWiped = true;
    soldier.isActive = false;
    await soldier.save();

    console.log('✅ Kill Switch activated for:', soldier.name);

    res.status(200).json({
      message: `🔴 Kill Switch activated for ${soldier.name}`
    });

  } catch (err) {
    console.log('❌ Kill Switch error:', err.message);
    res.status(500).json({ message: '❌ Server error: ' + err.message });
  }
});

module.exports = router;