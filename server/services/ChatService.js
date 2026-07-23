const ChatMessage = require('../models/ChatMessage');
const Room = require('../models/Room');

const BAD_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'crap', 'damn'];
const PROFANITY_REGEX = new RegExp(BAD_WORDS.join('|'), 'gi');

class ChatService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  filterProfanity(text) {
    if (!text) return '';
    return text.replace(PROFANITY_REGEX, '***');
  }

  async getHistory(roomCode) {
    const room = await Room.findOne({ code: roomCode });
    if (!room) return [];
    
    return ChatMessage.find({ roomId: room._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
  }

  async addMessage(roomCode, userId, username, text, type = 'chat') {
    const room = await Room.findOne({ code: roomCode });
    if (!room) throw new Error('Room not found');

    const cleanText = this.filterProfanity(text);

    const msg = new ChatMessage({
      roomId: room._id,
      userId,
      username,
      text: cleanText,
      type
    });

    await msg.save();
    
    // Broadcast message to room
    if (this.io) {
      this.io.to(`room:${roomCode}`).emit('chat:message', {
        _id: msg._id,
        userId,
        username,
        text: cleanText,
        type,
        createdAt: msg.createdAt
      });
    }

    return msg;
  }

  async addSystemMessage(roomCode, text) {
    return this.addMessage(roomCode, null, 'System', text, 'system');
  }
}

module.exports = new ChatService();
