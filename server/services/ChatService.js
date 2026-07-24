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

  async addMessage(roomCode, userId, username, text, type = 'chat', replyTo = null) {
    const room = await Room.findOne({ code: roomCode });
    if (!room) throw new Error('Room not found');

    const cleanText = this.filterProfanity(text);

    const msg = new ChatMessage({
      roomId: room._id,
      userId,
      username,
      text: cleanText,
      type,
      replyTo
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
        replyTo,
        createdAt: msg.createdAt
      });
    }

    return msg;
  }

  async addSystemMessage(roomCode, text) {
    if (this.io) {
      this.io.to(`room:${roomCode}`).emit('room:notification', { text });
    }
  }

  async toggleReaction(roomCode, messageId, userId, emoji) {
    const msg = await ChatMessage.findById(messageId);
    if (!msg) throw new Error('Message not found');

    const reactionIndex = msg.reactions.findIndex(r => r.emoji === emoji);
    if (reactionIndex > -1) {
      const userIndex = msg.reactions[reactionIndex].userIds.indexOf(userId);
      if (userIndex > -1) {
        // User already reacted, so remove it
        msg.reactions[reactionIndex].userIds.splice(userIndex, 1);
        if (msg.reactions[reactionIndex].userIds.length === 0) {
          msg.reactions.splice(reactionIndex, 1);
        }
      } else {
        // User hasn't reacted with this emoji yet
        msg.reactions[reactionIndex].userIds.push(userId);
      }
    } else {
      // Emoji doesn't exist yet
      msg.reactions.push({ emoji, userIds: [userId] });
    }

    await msg.save();

    if (this.io) {
      this.io.to(`room:${roomCode}`).emit('chat:reactionUpdated', {
        messageId: msg._id,
        reactions: msg.reactions
      });
    }

    return msg;
  }
}

module.exports = new ChatService();
