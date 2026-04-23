const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  serviceId: {
    type: String,
    required: true,
    unique: true,  // No two soldiers same ID
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    enum: ['Commander', 'Soldier'],  // Only these two ranks allowed
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true   // Kill Switch will set this to false
  },
  deviceWiped: {
    type: Boolean,
    default: false  // For Kill Switch feature
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);