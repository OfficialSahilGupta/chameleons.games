const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String }, // Optional
  passwordHash: { type: String }, // Optional (guests skip this)
  isGuest: { type: Boolean, default: true },
  isAdmin: { type: Boolean, default: false },
  avatarUrl: { type: String },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    timesCaughtAsChameleon: { type: Number, default: 0 },
    timesVotedCorrectly: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
