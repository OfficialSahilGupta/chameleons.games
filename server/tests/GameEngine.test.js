const GameEngine = require('../services/GameEngine').GameEngine;

describe('GameEngine Unit Tests', () => {
  let engine;
  let mockIo;
  
  beforeEach(() => {
    mockIo = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn()
    };
    
    // Clear ACTIVE_GAMES map via instance methods? GameEngine uses a module-level map
    // We can just create a fresh instance and inject a mock ACTIVE_GAMES if it was injectable,
    // but it's not. We'll rely on the real one and just use unique room codes.
    engine = new GameEngine(mockIo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('callVote should transition phase to voting', () => {
    // We need to inject a mock game state into the engine's internal map
    const code = 'TEST1';
    const mockGame = {
      code,
      phase: 'discussion',
      players: [{ id: 'u1' }, { id: 'u2' }],
      votes: [],
      timerTimeout: setTimeout(() => {}, 1000)
    };
    require('../services/GameEngine').ACTIVE_GAMES.set(code, mockGame);
    
    engine.callVote(code, 'u1');
    
    expect(mockGame.phase).toBe('voting');
    expect(mockIo.to).toHaveBeenCalledWith(`room:${code}`);
    expect(mockIo.emit).toHaveBeenCalledWith('game:state', expect.objectContaining({ phase: 'voting' }));
  });

  test('handleVote should tally votes and trigger endVoting if all voted', () => {
    const code = 'TEST2';
    const mockGame = {
      code,
      phase: 'voting',
      players: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }],
      votes: [],
      timerTimeout: setTimeout(() => {}, 1000)
    };
    require('../services/GameEngine').ACTIVE_GAMES.set(code, mockGame);
    
    engine.endVoting = jest.fn(); // Mock endVoting

    engine.handleVote(code, 'u1', 'u2');
    expect(mockGame.votes).toHaveLength(1);
    expect(engine.endVoting).not.toHaveBeenCalled();

    // Prevent voting for self
    engine.handleVote(code, 'u2', 'u2');
    expect(mockGame.votes).toHaveLength(1);

    engine.handleVote(code, 'u2', 'u3');
    engine.handleVote(code, 'u3', 'u2');
    
    // All 3 voted, should trigger endVoting
    expect(engine.endVoting).toHaveBeenCalledWith(code);
  });
});
