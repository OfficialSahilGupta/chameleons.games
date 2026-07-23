const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const categoryRoutes = require('./routes/categories');
const socketAuthMiddleware = require('./middleware/socketAuth');

dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chameleons';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

const roomService = require('./services/RoomService');
const gameEngine = require('./services/GameEngine');

// Socket auth middleware
io.use(socketAuthMiddleware);

const engine = gameEngine.init(io);

const broadcastRooms = async () => {
  const rooms = await roomService.getAllRooms();
  io.emit('rooms:update', rooms);
};

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}, User: ${socket.user?.username}`);
  
  // Send initial room list when user connects
  broadcastRooms();
  
  socket.on('rooms:create', async (roomData, callback) => {
    try {
      const room = await roomService.createRoom(socket.user.id, roomData);
      socket.join(`room:${room.code}`);
      broadcastRooms();
      if (callback) callback({ success: true, roomCode: room.code });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('rooms:join', async ({ code }, callback) => {
    try {
      const room = await roomService.joinRoom(code, socket.user.id);
      socket.join(`room:${room.code}`);
      broadcastRooms();
      if (callback) callback({ success: true, roomCode: room.code });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  const emitRoomState = async (code) => {
    try {
      const room = await roomService.getRoomByCode(code);
      if (room) {
        io.to(`room:${code}`).emit('room:stateUpdated', room);
      }
    } catch (err) {
      console.error('Error emitting room state:', err);
    }
  };

  socket.on('room:get', async ({ code }, callback) => {
    try {
      const room = await roomService.getRoomByCode(code);
      socket.join(`room:${code}`);
      if (callback) callback({ success: true, room });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('room:updateSettings', async ({ code, settings }, callback) => {
    try {
      await roomService.updateRoomSettings(code, socket.user.id, settings);
      emitRoomState(code);
      broadcastRooms();
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('room:toggleReady', async ({ code, isReady }, callback) => {
    try {
      await roomService.toggleReady(code, socket.user.id, isReady);
      emitRoomState(code);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('room:startGame', async ({ code }, callback) => {
    try {
      await roomService.startGame(code, socket.user.id);
      emitRoomState(code);
      broadcastRooms();
      await engine.initializeGame(code); // Start engine
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  // GAME ENGINE EVENTS
  socket.on('game:clue:submit', ({ code, text }) => {
    engine.handleClueSubmit(code, socket.user.id, text);
  });

  socket.on('game:vote:submit', ({ code, votedForId }) => {
    engine.handleVote(code, socket.user.id, votedForId);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
