const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settings: {
    maxPlayers: { type: Number, default: 8 },
    minPlayers: { type: Number, default: 3 },
    roundCount: { type: Number, default: 3 },
    timerSeconds: { type: Number, default: 30 },
    enabledCategories: [{ type: String }],
    isPrivate: { type: Boolean, default: false },
    password: { type: String }
  },
  status: {
    type: String,
    enum: ['lobby', 'in_progress', 'voting', 'reveal', 'finished'],
    default: 'lobby'
  },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    socketId: { type: String },
    isReady: { type: Boolean, default: false },
    isConnected: { type: Boolean, default: true },
    isChameleon: { type: Boolean, default: false },
    hasSubmittedClue: { type: Boolean, default: false },
    score: { type: Number, default: 0 }
  }],
  currentRound: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
