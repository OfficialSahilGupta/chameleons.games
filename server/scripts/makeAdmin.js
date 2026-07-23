const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chameleons';

async function makeAdmin() {
  try {
    const username = process.argv[2];
    if (!username) {
      console.error('Please provide a username: node makeAdmin.js <username>');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`User '${username}' not found.`);
      process.exit(1);
    }

    user.isAdmin = true;
    await user.save();
    
    console.log(`Successfully made '${username}' an admin.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

makeAdmin();
