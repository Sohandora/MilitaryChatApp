const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
  soldierName: {
    type: String,
    required: true
  },
  soldierServiceId: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: '🚨 EMERGENCY — SOLDIER NEEDS IMMEDIATE ASSISTANCE'
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('SOS', sosSchema);