const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['chat', 'system'],
    default: 'chat'
  },
  replyTo: {
    messageId: { type: String },
    username: { type: String },
    text: { type: String }
  }
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
