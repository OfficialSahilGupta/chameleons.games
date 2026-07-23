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
// @desc Register an account with email/password
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({
      username,
      email,
      passwordHash,
      isGuest: false
    });

    await user.save();
    const token = generateToken(user);

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route POST /api/auth/login
// @desc Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.isGuest) {
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
