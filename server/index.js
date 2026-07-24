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

// Setup Redis adapter for Socket.io
const { createAdapter } = require('@socket.io/redis-adapter');
const redisClient = require('./redisClient');
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

pubClient.on('error', (err) => console.error('Redis PubClient Error:', err.message));
subClient.on('error', (err) => console.error('Redis SubClient Error:', err.message));

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter attached to Socket.io');
}).catch(err => console.error('Redis Adapter Error:', err.message));

const roomService = require('./services/RoomService');
const gameEngine = require('./services/GameEngine');
const chatService = require('./services/ChatService');

// Socket auth middleware
io.use(socketAuthMiddleware);

chatService.setIO(io);
const engine = gameEngine.init(io);

const broadcastRooms = async () => {
  const rooms = await roomService.getAllRooms();
  io.emit('rooms:update', rooms);
};

const socketRooms = new Map();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}, User: ${socket.user?.username}`);
  
  if (socket.user && socket.user.id) {
    socket.join(`user:${socket.user.id}`);
  }
  
  // Send initial room list when user connects
  broadcastRooms();
  
  socket.on('rooms:create', async (roomData, callback) => {
    try {
      const room = await roomService.createRoom(socket.user.id, roomData);
      socket.join(`room:${room.code}`);
      socketRooms.set(socket.id, room.code);
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
      socketRooms.set(socket.id, room.code);
      emitRoomState(code); // Fix: Notify everyone in the room that someone joined
      broadcastRooms();
      await chatService.addSystemMessage(code, `${socket.user.username} joined the room`);
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
      socketRooms.set(socket.id, code);
      if (callback) callback({ success: true, room });

      // Send current game state if in progress
      if (room.status === 'in_progress' || room.status === 'finished') {
        engine.sendStateToUser(code, socket.id, socket.user.id);
      }
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

  socket.on('room:kickPlayer', async ({ code, targetUserId }) => {
    try {
      const room = await roomService.getRoomByCode(code);
      if (room && room.hostId._id.toString() === socket.user.id) {
        await roomService.leaveRoom(code, targetUserId);
        
        // Add to banned players so they cannot rejoin
        if (!room.bannedPlayers) room.bannedPlayers = [];
        room.bannedPlayers.push(targetUserId);
        await room.save();
        
        emitRoomState(code);
        broadcastRooms();
        io.to(`room:${code}`).emit('room:kicked', { kickedUserId: targetUserId });
      }
    } catch (err) {
      console.error('Error kicking player:', err);
    }
  });

  socket.on('room:leave', async ({ code }, callback) => {
    try {
      await roomService.leaveRoom(code, socket.user.id);
      socket.leave(`room:${code}`);
      socketRooms.delete(socket.id);
      emitRoomState(code);
      broadcastRooms();
      await chatService.addSystemMessage(code, `${socket.user.username} left the room`);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('room:transferHost', async ({ code, targetUserId }, callback) => {
    try {
      const room = await roomService.getRoomByCode(code);
      if (room && room.hostId._id.toString() === socket.user.id) {
        if (room.status !== 'lobby') {
          if (callback) callback({ success: false, message: 'Cannot transfer host while game is active.' });
          return;
        }
        
        // Check if target is already hosting another room
        const RoomModel = require('./models/Room');
        const existingRoom = await RoomModel.findOne({ 
          hostId: targetUserId, 
          status: { $ne: 'finished' } 
        });
        
        if (existingRoom) {
          if (callback) callback({ success: false, message: 'That player is already hosting another active room.' });
          return;
        }

        room.hostId = targetUserId;
        await room.save();
        
        emitRoomState(code);
        broadcastRooms();
        if (callback) callback({ success: true });
      } else {
        if (callback) callback({ success: false, message: 'You are not the host.' });
      }
    } catch (err) {
      console.error('Error transferring host:', err);
      if (callback) callback({ success: false, message: 'Server error.' });
    }
  });

  socket.on('room:playAgain', async ({ code }, callback) => {
    try {
      await roomService.resetRoom(code, socket.user.id);
      emitRoomState(code);
      broadcastRooms();
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

  socket.on('game:callVote', ({ code }) => {
    engine.callVote(code, socket.user.id);
  });

  socket.on('game:chameleonGuess', ({ code, guess }) => {
    engine.handleChameleonGuess(code, socket.user.id, guess);
  });

  // CHAT EVENTS
  socket.on('chat:history', async ({ code }, callback) => {
    try {
      const history = await chatService.getHistory(code);
      if (callback) callback({ success: true, history: history.reverse() });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('chat:send', async ({ code, text }, callback) => {
    try {
      await chatService.addMessage(code, socket.user.id, socket.user.username, text);
      if (callback) callback({ success: true });
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  socket.on('user:updateAvatar', async ({ seed }, callback) => {
    try {
      const User = require('./models/User');
      const user = await User.findById(socket.user.id);
      if (user) {
        user.avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
        await user.save();
        
        // Update room state if they are in a room
        const code = socketRooms.get(socket.id);
        if (code) {
          const roomService = require('./services/RoomService');
          const room = await roomService.getRoomByCode(code);
          if (room) {
            const p = room.players.find(p => p.userId._id.toString() === socket.user.id);
            if (p) {
              p.userId.avatarUrl = user.avatarUrl; // Update populated obj locally before broadcast
            }
            io.to(`room:${code}`).emit('room:stateUpdated', room);
          }
        }
        
        if (callback) callback({ success: true, avatarUrl: user.avatarUrl });
      }
    } catch (err) {
      if (callback) callback({ success: false, message: err.message });
    }
  });

  const currentRoom = socketRooms.get(socket.id);
  if (currentRoom) {
    engine.handleDisconnect(currentRoom, socket.user?.id);
    socketRooms.delete(socket.id);
  }

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    const code = socketRooms.get(socket.id);
    if (code && socket.user) {
      engine.handleDisconnect(code, socket.user.id);
      socketRooms.delete(socket.id);
    }
  });
});

// Periodic Room Cleanup Job (Runs every 2 minutes)
setInterval(async () => {
  try {
    const Room = require('./models/Room');
    const allRooms = await Room.find({ status: { $ne: 'finished' } });
    
    let cleanedCount = 0;
    for (const room of allRooms) {
      const roomClients = io.sockets.adapter.rooms.get(`room:${room.code}`);
      if (!roomClients || roomClients.size === 0) {
        // No active socket connections for this room
        // If it's empty or inactive, mark it as finished or delete it
        room.status = 'finished';
        await room.save();
        
        // Also cleanup game engine if it was active
        const engine = require('./services/GameEngine');
        if (engine.ACTIVE_GAMES) {
          engine.ACTIVE_GAMES.delete(room.code);
        }
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`[Cleanup] Finished ${cleanedCount} inactive rooms.`);
      broadcastRooms();
    }
  } catch (err) {
    console.error('Room cleanup error:', err);
  }
}, 2 * 60 * 1000); // 2 minutes

const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
