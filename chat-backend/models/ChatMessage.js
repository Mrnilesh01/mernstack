const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  message: String,
  file: String,
  fileName: String,
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
