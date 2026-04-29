const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRank: {
    type: String,
    enum: ['Commander', 'Soldier'],
    required: true
  },
  senderId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  readBy: [
    {
      type: String  // Array of userIds who have read the message
    }
  ],
  burnAfter: {
    type: Date,
    default: null  // For burn-on-read feature in Module 4
  },
  fileUrl: {
  type: String,
  default: null
},
fileName: {
  type: String,
  default: null
},
fileType: {
  type: String,
  default: null
}
  
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);