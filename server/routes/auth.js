const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, isGuest: user.isGuest },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// @route POST /api/auth/guest
// @desc Create a guest user and return JWT
router.post('/guest', async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const guestUser = new User({
      username,
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      isGuest: true
    });

    await guestUser.save();
    const token = generateToken(guestUser);

    res.json({ token, user: guestUser });
  } catch (err) {
    console.error('Guest login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/auth/register
// @desc Register an account with username/password (no email)
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password needs to be at least 8 characters' });
    }
    
    // Check for alphanumeric only to prevent spaces/special chars
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      return res.status(400).json({ message: 'Username needs to be unique, no spaces or special characters' });
    }

    let user = await User.findOne({ username, isGuest: { $ne: true } });
    if (user) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      username,
      passwordHash,
      isGuest: false,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    });

    await user.save();
    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/auth/login
// @desc Login with username/password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username, isGuest: { $ne: true } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
