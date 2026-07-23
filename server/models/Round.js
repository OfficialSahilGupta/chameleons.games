const mongoose = require('mongoose');

const RoundSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roundNumber: { type: Number, required: true },
  category: { type: String, required: true },
  secretWord: { type: String, required: true },
  chameleonUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clues: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String },
    submittedAt: { type: Date, default: Date.now },
    order: { type: Number }
  }],
  votes: [{
    voterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    votedForId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  eliminatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eliminatedWasChameleon: { type: Boolean },
  outcome: { type: String },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

module.exports = mongoose.model('Round', RoundSchema);
