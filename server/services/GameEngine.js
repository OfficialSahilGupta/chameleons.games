const Room = require('../models/Room');
const Round = require('../models/Round');
const wordBankService = require('./WordBankService');
const chatService = require('./ChatService');

const ACTIVE_GAMES = new Map(); // code -> GameState

class GameEngine {
  constructor(io) {
    this.io = io;
  }

  async initializeGame(roomCode) {
    const room = await Room.findOne({ code: roomCode }).populate('players.userId');
    if (!room) throw new Error('Room not found');

    // Check if game already running
    if (ACTIVE_GAMES.has(roomCode)) return;

    // Initialize scores if not present
    const playersWithScores = room.players.map(p => ({
      id: p.userId._id.toString(),
      username: p.userId.username,
      score: 0,
      isOnline: true
    }));

    const gameState = {
      code: roomCode,
      roomId: room._id,
      players: playersWithScores,
      settings: room.settings,
      currentRoundNumber: 1,
      chameleonId: null,
      secretWord: null,
      category: null,
      clues: [],
      votes: [],
      timerTimeout: null,
      previousChameleonId: null,
      phase: 'assigning_roles' // assigning_roles -> clue_writing -> discussion -> voting -> reveal
    };

    ACTIVE_GAMES.set(roomCode, gameState);
    await chatService.addSystemMessage(roomCode, `Round ${gameState.currentRoundNumber} started!`);
    await this.startRound(roomCode);
  }

  async startRound(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    game.phase = 'assigning_roles';
    game.clues = [];
    game.votes = [];
    this.broadcastState(roomCode, game);

    // 1. Assign Role
    let potentialChameleons = game.players.filter(p => p.id !== game.previousChameleonId);
    if (potentialChameleons.length === 0) potentialChameleons = game.players;
    const chameleon = potentialChameleons[Math.floor(Math.random() * potentialChameleons.length)];
    game.chameleonId = chameleon.id;
    game.previousChameleonId = chameleon.id;

    // 2. Pick Word
    const enabledCategories = game.settings.enabledCategories;
    if (enabledCategories.length === 0) throw new Error('No categories enabled');
    game.category = enabledCategories[Math.floor(Math.random() * enabledCategories.length)];
    game.secretWord = await wordBankService.getRandomWord(game.category);

    // Save round to DB
    const round = new Round({
      roomId: game.roomId,
      roundNumber: game.currentRoundNumber,
      category: game.category,
      secretWord: game.secretWord,
      chameleonUserId: game.chameleonId
    });
    const savedRound = await round.save();
    game.currentRoundDbId = savedRound._id;

    // Wait a brief moment for dramatic effect
    setTimeout(() => {
      // Reveal words
      game.players.forEach(p => {
        const isChameleon = p.id === game.chameleonId;
        this.io.to(`user:${p.id}`).emit('word:reveal', {
          category: game.category,
          word: isChameleon ? null : game.secretWord,
          isChameleon
        });
      });

      this.startClueWriting(roomCode);
    }, 3000);
  }

  startClueWriting(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    game.phase = 'clue_writing';
    chatService.addSystemMessage(roomCode, 'Clue writing phase started.');
    const duration = game.settings.timerSeconds * 1000;
    const endsAt = Date.now() + duration;

    this.broadcastState(roomCode, game, { endsAt });

    game.timerTimeout = setTimeout(() => {
      this.endClueWriting(roomCode);
    }, duration);
  }

  handleClueSubmit(roomCode, userId, text) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game || game.phase !== 'clue_writing') return;

    const existingClue = game.clues.find(c => c.userId === userId);
    if (existingClue) return; // Already submitted

    game.clues.push({
      userId,
      text,
      submittedAt: new Date()
    });

    // Notify everyone a clue was submitted
    this.io.to(`room:${roomCode}`).emit('clue:submitted', { userId });

    // Asymmetric peek for Chameleon
    if (userId !== game.chameleonId) {
      const chameleonClue = game.clues.find(c => c.userId === game.chameleonId);
      if (!chameleonClue) {
        // Chameleon hasn't submitted yet, maybe send them a peek
        // Only send the peek ONCE when the first villager submits a clue
        const villagerClues = game.clues.filter(c => c.userId !== game.chameleonId);
        if (villagerClues.length === 1) {
          const peekClue = villagerClues[0];
          this.io.to(`user:${game.chameleonId}`).emit('clue:peek', {
            fromUserId: peekClue.userId,
            text: peekClue.text
          });
        }
      }
    } else {
      // If chameleon submits, broadcast to villagers
      const player = game.players.find(p => p.id === userId);
      // Villagers see live feed
      game.players.forEach(p => {
        if (p.id !== game.chameleonId) {
          this.io.to(`user:${p.id}`).emit('clue:feed', {
            userId,
            username: player.username,
            text
          });
        }
      });
    }

    // Villagers also broadcast feed to other villagers
    if (userId !== game.chameleonId) {
       const player = game.players.find(p => p.id === userId);
       game.players.forEach(p => {
        if (p.id !== game.chameleonId) {
          this.io.to(`user:${p.id}`).emit('clue:feed', {
            userId,
            username: player.username,
            text
          });
        }
      });
    }

    // Check if everyone submitted
    if (game.clues.length === game.players.length) {
      clearTimeout(game.timerTimeout);
      this.endClueWriting(roomCode);
    }
  }

  async endClueWriting(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    // Auto-fill empty clues
    game.players.forEach(p => {
      if (!game.clues.find(c => c.userId === p.id)) {
        game.clues.push({ userId: p.id, text: '*Time ran out*', submittedAt: new Date() });
      }
    });

    // Update DB
    await Round.findByIdAndUpdate(game.currentRoundDbId, { clues: game.clues });

    this.startDiscussion(roomCode);
  }

  startDiscussion(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    game.phase = 'discussion';
    chatService.addSystemMessage(roomCode, 'Discussion phase started.');
    const duration = 60 * 1000; // 1 min discussion placeholder
    const endsAt = Date.now() + duration;

    // Attach full clues to state for discussion
    const stateToSend = { ...game };
    
    this.broadcastState(roomCode, stateToSend, { endsAt, fullClues: game.clues });

    game.timerTimeout = setTimeout(() => {
      this.startVoting(roomCode);
    }, duration);
  }

  callVote(roomCode, userId) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game || game.phase !== 'discussion') return;
    
    clearTimeout(game.timerTimeout);
    chatService.addSystemMessage(roomCode, 'A vote has been called early!');
    this.startVoting(roomCode);
  }

  startVoting(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    game.phase = 'voting';
    chatService.addSystemMessage(roomCode, 'Voting phase started.');
    const duration = 30 * 1000;
    const endsAt = Date.now() + duration;

    this.broadcastState(roomCode, game, { endsAt });

    game.timerTimeout = setTimeout(() => {
      this.endVoting(roomCode);
    }, duration);
  }

  handleVote(roomCode, voterId, votedForId) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game || game.phase !== 'voting') return;

    // A player cannot vote for themselves
    if (voterId === votedForId) return;

    const existingVote = game.votes.find(v => v.voterId === voterId);
    if (existingVote) return;

    game.votes.push({ voterId, votedForId });
    
    if (this.io) {
      this.io.to(`room:${roomCode}`).emit('vote:submitted', { userId: voterId });
    }

    if (game.votes.length === game.players.length) {
      clearTimeout(game.timerTimeout);
      this.endVoting(roomCode);
    }
  }

  async endVoting(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    // Tally votes
    const voteCounts = {};
    game.votes.forEach(v => {
      voteCounts[v.votedForId] = (voteCounts[v.votedForId] || 0) + 1;
    });

    let maxVotes = 0;
    let eliminatedId = null;

    Object.keys(voteCounts).forEach(id => {
      if (voteCounts[id] > maxVotes) {
        maxVotes = voteCounts[id];
        eliminatedId = id;
      } else if (voteCounts[id] === maxVotes) {
        // Tie - simple random breaker for now
        if (Math.random() > 0.5) eliminatedId = id;
      }
    });

    const isChameleonEliminated = eliminatedId === game.chameleonId;
    let eliminatedUser = game.players.find(p => p.id === eliminatedId);
    let eliminatedUsername = eliminatedUser ? eliminatedUser.username : 'Someone';

    await chatService.addSystemMessage(roomCode, `${eliminatedUsername} was eliminated! They were ${isChameleonEliminated ? 'the Chameleon' : 'an innocent Villager'}.`);

    if (isChameleonEliminated) {
      game.phase = 'chameleon_guess';
      chatService.addSystemMessage(roomCode, `The Chameleon has one chance to guess the secret word!`);
      
      this.broadcastState(roomCode, game, { eliminatedId, isChameleonEliminated, endsAt: Date.now() + 20000 });
      
      game.timerTimeout = setTimeout(() => {
        this.endRound(roomCode, eliminatedId, false); // Failed guess
      }, 20000);
      
    } else {
      // Innocent eliminated -> Chameleon wins round
      chatService.addSystemMessage(roomCode, `The Chameleon is still among you...`);
      this.endRound(roomCode, eliminatedId, null);
    }
  }

  handleChameleonGuess(roomCode, userId, guess) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game || game.phase !== 'chameleon_guess') return;
    if (userId !== game.chameleonId) return;

    clearTimeout(game.timerTimeout);
    const correct = guess.trim().toLowerCase() === game.secretWord.trim().toLowerCase();
    
    chatService.addSystemMessage(roomCode, `The Chameleon guessed: ${guess}... ${correct ? 'CORRECT!' : 'WRONG!'}`);
    this.endRound(roomCode, game.chameleonId, correct);
  }

  async endRound(roomCode, eliminatedId, chameleonGuessedCorrectly) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    const isChameleonEliminated = eliminatedId === game.chameleonId;
    
    // Scoring logic
    if (isChameleonEliminated) {
      if (chameleonGuessedCorrectly) {
        // Chameleon caught, but guessed word -> +3 points
        game.players.forEach(p => {
          if (p.id === game.chameleonId) p.score += 3;
        });
      } else {
        // Chameleon caught, failed guess -> +1 for villagers who voted for chameleon
        game.votes.forEach(v => {
          if (v.votedForId === game.chameleonId && v.voterId !== game.chameleonId) {
            const villager = game.players.find(p => p.id === v.voterId);
            if (villager) villager.score += 1;
          }
        });
      }
    } else {
      // Innocent eliminated -> Chameleon survived -> +2 points
      game.players.forEach(p => {
        if (p.id === game.chameleonId) p.score += 2;
      });
    }

    game.phase = 'reveal';
    
    // Update round
    await Round.findByIdAndUpdate(game.currentRoundDbId, {
      votes: game.votes,
      eliminatedUserId: eliminatedId,
      eliminatedWasChameleon: isChameleonEliminated,
      outcome: isChameleonEliminated ? (chameleonGuessedCorrectly ? 'chameleon_caught_but_guessed' : 'chameleon_caught') : 'chameleon_escaped',
      endedAt: new Date()
    });

    this.broadcastState(roomCode, game, { eliminatedId, isChameleonEliminated, chameleonGuessedCorrectly });

    // Move to next round or end game after delay
    setTimeout(() => {
      if (game.currentRoundNumber >= game.settings.roundCount) {
        this.endGame(roomCode);
      } else {
        game.currentRoundNumber++;
        this.startRound(roomCode);
      }
    }, 10000);
  }

  async endGame(roomCode) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    await Room.findByIdAndUpdate(game.roomId, { status: 'finished' });
    
    // Broadcast final state before cleaning up
    game.phase = 'game_over';
    this.broadcastState(roomCode, game);

    // Keep it in ACTIVE_GAMES so the frontend can still view the score?
    // We should delete it when room is reset to lobby.
    // For now, let's keep it until Play Again is clicked (which restarts game engine).
    // Actually, `initializeGame` will overwrite it anyway.
  }

  broadcastState(roomCode, game, extraPayload = {}) {
    // We don't want to broadcast the secretWord or chameleonId generically to everyone in the room!
    // So we broadcast a sanitized state.
    const sanitizedGame = {
      phase: game.phase,
      currentRoundNumber: game.currentRoundNumber,
      category: game.category, // Category is public
      players: game.players,
      settings: game.settings,
      ...extraPayload
    };
    
    this.io.to(`room:${roomCode}`).emit('game:state', sanitizedGame);
  }

  sendStateToUser(roomCode, socketId, userId) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    const player = game.players.find(p => p.id === userId);
    if (player) {
      player.isOnline = true;
      this.broadcastState(roomCode, game); // Update others that they are online

      // Send the specific private info back to them
      const isChameleon = game.chameleonId === userId;
      this.io.to(socketId).emit('word:reveal', {
        category: game.category,
        word: isChameleon ? null : game.secretWord,
        isChameleon
      });
    }
  }

  handleDisconnect(roomCode, userId) {
    const game = ACTIVE_GAMES.get(roomCode);
    if (!game) return;

    const player = game.players.find(p => p.id === userId);
    if (player) {
      player.isOnline = false;
      this.broadcastState(roomCode, game);
    }
  }
}

let instance = null;
module.exports = {
  init: (io) => {
    if (!instance) instance = new GameEngine(io);
    return instance;
  },
  getInstance: () => instance,
  ACTIVE_GAMES,
  GameEngine
};
