const Room = require('../models/Room');
const crypto = require('crypto');

class RoomService {
  async getAllRooms() {
    return Room.find({ status: { $in: ['lobby', 'in_progress', 'voting'] } })
      .populate('hostId', 'username avatarUrl')
      .populate('players.userId', 'username avatarUrl')
      .sort({ createdAt: -1 });
  }

  async getRoomByCode(code) {
    return Room.findOne({ code })
      .populate('hostId', 'username avatarUrl')
      .populate('players.userId', 'username avatarUrl');
  }

  async createRoom(hostId, roomData) {
    const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const room = new Room({
      code,
      name: roomData.name || `${roomData.hostName}'s Room`,
      hostId,
      settings: {
        maxPlayers: roomData.maxPlayers || 8,
        minPlayers: roomData.minPlayers || 3,
        roundCount: roomData.roundCount || 3,
        timerSeconds: roomData.timerSeconds || 30,
        enabledCategories: roomData.enabledCategories || [],
        isPrivate: roomData.isPrivate || false,
        password: roomData.password || '',
        turnMode: roomData.turnMode || 'simultaneous',
        allowSpectators: roomData.allowSpectators || false
      },
      players: [{
        userId: hostId,
        isReady: false,
        isConnected: true
      }]
    });
    return room.save();
  }

  async joinRoom(code, userId) {
    const room = await this.getRoomByCode(code);
    if (!room) throw new Error('Room not found');
    
    // Check if player is already in room
    const existingPlayer = room.players.find(p => p.userId._id.toString() === userId.toString());
    
    if (existingPlayer) {
      existingPlayer.isConnected = true;
      return room.save();
    }

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('Room is full');
    }

    room.players.push({
      userId,
      isReady: false,
      isConnected: true
    });
    
    return room.save();
  }

  async updateRoomSettings(code, hostId, newSettings) {
    const room = await this.getRoomByCode(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId._id.toString() !== hostId.toString()) throw new Error('Only the host can update settings');

    if (newSettings.name) {
      room.name = newSettings.name;
      delete newSettings.name;
    }
    
    // Merge nested settings
    Object.assign(room.settings, newSettings);
    
    return room.save();
  }

  async toggleReady(code, userId, isReady) {
    const room = await this.getRoomByCode(code);
    if (!room) throw new Error('Room not found');
    
    const player = room.players.find(p => p.userId._id.toString() === userId.toString());
    if (player) {
      player.isReady = isReady;
      return room.save();
    }
    throw new Error('Player not in room');
  }

  async startGame(code, hostId) {
    const room = await this.getRoomByCode(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId._id.toString() !== hostId.toString()) throw new Error('Only the host can start the game');

    if (room.players.length < room.settings.minPlayers) {
      throw new Error(`Need at least ${room.settings.minPlayers} players`);
    }

    const allReady = room.players.every(p => p.isReady || p.userId._id.toString() === hostId.toString());
    if (!allReady) {
      throw new Error('All players must be ready');
    }

    room.status = 'in_progress';
    room.currentRound = 1;
    return room.save();
  }
}

module.exports = new RoomService();
