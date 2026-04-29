const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ── REGISTER ──────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, serviceId, password, rank, unit, accessCode } = req.body;
    // Validate Service ID format (e.g. INDIA-7-9)
    const serviceIdRegex = /^[A-Z]+-\d+-\d+$/;
    if (!serviceIdRegex.test(serviceId)) {
      return res.status(400).json({
        message: '❌ Invalid Service ID format. Use format: INDIA-7-9'
      });
    }

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      message: '❌ Password must be at least 6 characters.'
    });
  }

    // Verify access code based on rank
    if (rank === 'Commander') {
      if (accessCode !== process.env.COMMANDER_CODE) {
        return res.status(403).json({
          message: '❌ Invalid Credentials.'
        });
      }
    }

    if (rank === 'Soldier') {
      if (accessCode !== process.env.SOLDIER_CODE) {
        return res.status(403).json({
          message: '❌ Invalid Credentials.'
        });
      }
    }

    // Check if Service ID already exists
    const existingUser = await User.findOne({ serviceId });
    if (existingUser) {
      return res.status(400).json({
        message: '❌ Service ID already registered.'
      });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      serviceId,
      password: hashedPassword,
      rank,
      unit
    });

    await newUser.save();
    res.status(201).json({ message: '✅ Registration successful!' });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

// ── LOGIN ─────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { serviceId, password } = req.body;

    // Find user by Service ID
    const user = await User.findOne({ serviceId });
    if (!user) {
      return res.status(404).json({ message: '❌ Invalid Credentials.' });
    }

    // Check if device was wiped
    if (user.deviceWiped) {
      return res.status(403).json({ 
        message: '🔴 Device wiped. Contact your Commander.' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '❌ Invalid Credentials.' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        rank: user.rank, 
        name: user.name,
        unit: user.unit
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }  // Token expires in 8 hours
    );

    res.status(200).json({
      message: '✅ Login successful!',
      token,
      user: {
        name: user.name,
        rank: user.rank,
        unit: user.unit,
        serviceId: user.serviceId
      }
    });

  } catch (err) {
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
});

module.exports = router;