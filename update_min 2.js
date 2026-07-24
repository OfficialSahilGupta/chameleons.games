require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./server/models/Room');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chameleons');
  await Room.updateMany({}, { $set: { "settings.minPlayers": 2 } });
  console.log('Updated minPlayers');
  process.exit(0);
}
run();
