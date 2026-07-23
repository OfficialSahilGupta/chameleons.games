const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
  // Client can send token in auth payload: io("url", { auth: { token: "..." } })
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
};
