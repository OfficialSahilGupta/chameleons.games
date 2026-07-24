import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { playTick, playDing, playSting, playWin } from '../utils/soundFx';

interface GameUIProps {
  socket: Socket | null;
  code: string;
  user: any;
  room: any;
}

export default function GameUI({ socket, code, user, room }: GameUIProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [myRoleData, setMyRoleData] = useState<{ category: string, word: string | null, isChameleon: boolean, boardWords?: string[] } | null>(null);
  const [clueInput, setClueInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [hasSubmittedClue, setHasSubmittedClue] = useState(false);
  const currentUserId = (user as any)?._id || user?.id;
  const isHost = String(room.hostId._id || room.hostId) === String(currentUserId);
  const [chameleonPeek, setChameleonPeek] = useState<{fromUserId: string, text: string} | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [clueFeed, setClueFeed] = useState<any[]>([]);
  const [submittedPlayers, setSubmittedPlayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!socket) return;

    socket.on('game:state', (state) => {
      setGameState(state);
      if (state.endsAt) {
        const remaining = Math.max(0, Math.floor((state.endsAt - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(0);
      }

      // Reset phase specific state
      if (state.phase === 'assigning_roles') {
        setClueInput('');
        setGuessInput('');
        setMyVote(null);
        setHasSubmittedClue(false);
        setChameleonPeek(null);
        setClueFeed([]);
        setSubmittedPlayers(new Set());
      }
      
      if (state.phase === 'discussion') {
        setSubmittedPlayers(new Set()); // Reset for voting
        setMyVote(null);
      }

      if (state.phase === 'reveal') {
        if (state.isChameleonEliminated) {
          playWin();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        } else {
          playSting();
        }
      }

      if (state.phase === 'chameleon_guess') {
        playSting();
      }

      if (state.phase === 'game_over') {
        confetti({ particleCount: 300, spread: 100, origin: { y: 0.6 } });
      }
    });

    socket.on('word:reveal', (data) => {
      setMyRoleData(data);
    });

    socket.on('clue:peek', (data) => {
      setChameleonPeek(data);
    });

    socket.on('clue:feed', (data) => {
      setClueFeed(prev => [...prev, data]);
    });

    socket.on('clue:submitted', (data) => {
      setSubmittedPlayers(prev => new Set(prev).add(data.userId));
      playDing();
    });

    socket.on('vote:submitted', (data) => {
      setSubmittedPlayers(prev => new Set(prev).add(data.userId));
      playDing();
    });

    return () => {
      socket.off('game:state');
      socket.off('word:reveal');
      socket.off('clue:peek');
      socket.off('clue:feed');
      socket.off('clue:submitted');
      socket.off('vote:submitted');
    };
  }, [socket]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          if (next > 0 && next <= 5) playTick();
          return next;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const submitClue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clueInput || hasSubmittedClue) return;
    socket?.emit('game:clue:submit', { code, text: clueInput });
    setHasSubmittedClue(true);
  };

  const submitVote = (votedForId: string) => {
    if (myVote) return;
    setMyVote(votedForId);
    socket?.emit('game:vote:submit', { code, votedForId });
  };

  const callVote = () => {
    socket?.emit('game:callVote', { code });
  };

  const submitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput) return;
    socket?.emit('game:chameleonGuess', { code, guess: guessInput });
  };

  const handlePlayAgain = () => {
    socket?.emit('room:playAgain', { code });
  };

  if (!gameState) {
    return <div className="text-center mt-20 text-xl animate-pulse">Initializing Game Engine...</div>;
  }

  // Handle Game Over differently, as it's the end of the session
  if (gameState.phase === 'game_over') {
    return (
      <div className="w-full h-full glass-panel rounded-2xl p-6 md:p-12 border border-white/5 shadow-2xl text-center flex flex-col gap-8 overflow-y-auto no-scrollbar">
        <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Game Over!</h2>
        
        <div className="bg-gray-900 rounded-2xl p-8 max-w-2xl mx-auto w-full shadow-inner border border-gray-700">
          <h3 className="text-2xl font-bold mb-6 text-gray-300 uppercase tracking-widest border-b border-gray-800 pb-4">Final Leaderboard</h3>
          <div className="flex flex-col gap-4">
            {[...gameState.players].sort((a:any, b:any) => b.score - a.score).map((p: any, idx: number) => (
              <div key={p.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-orange-400 text-black' : 'bg-gray-700 text-white'}`}>
                    {idx + 1}
                  </div>
                  <span className="text-xl font-semibold">{p.username} {p.id === user.id && <span className="text-sm text-gray-400 ml-2">(You)</span>}</span>
                </div>
                <div className="text-3xl font-black text-blue-400">{p.score} <span className="text-sm text-gray-500 font-normal">pts</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <button 
            onClick={() => window.location.href = '/lobby'}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-gray-700 hover:bg-gray-600 transition shadow-lg"
          >
            Back to Lobby
          </button>
          
          {isHost ? (
            <button 
              onClick={handlePlayAgain}
              className="px-8 py-4 rounded-xl font-bold text-lg bg-green-600 hover:bg-green-500 transition shadow-lg"
            >
              Play Again (Reset Room)
            </button>
          ) : (
            <div className="px-8 py-4 rounded-xl font-bold text-lg bg-gray-800 text-gray-500 border border-gray-700 shadow-inner">
              Waiting for Host to reset...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full glass-panel rounded-2xl p-6 md:p-8 border border-white/5 shadow-2xl overflow-y-auto no-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-700 gap-4">
        <h2 className="text-2xl font-bold text-green-400">Round {gameState.currentRoundNumber}</h2>
        <div className="text-xl font-mono bg-gray-900 px-4 py-2 rounded text-blue-400">
          Phase: {gameState.phase.replace('_', ' ').toUpperCase()}
        </div>
        {timeLeft > 0 && (
          <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>
        )}
      </div>

      {gameState.phase === 'assigning_roles' && (
        <div className="text-center py-20">
          <h3 className="text-4xl font-bold mb-4">Shh...</h3>
          <p className="text-gray-400 text-xl">The secret word is being chosen...</p>
        </div>
      )}

      {gameState.phase === 'clue_writing' && (
        <div className="flex flex-col gap-8">
          {/* Avatar Strip with Ticks */}
          <div className="flex justify-center gap-4 flex-wrap">
            {gameState.players.map((p: any) => {
              const hasSubmitted = submittedPlayers.has(p.id);
              return (
                <div key={p.id} className="relative flex flex-col items-center gap-1">
                  <div className={`relative rounded-full p-1 border-2 transition-colors ${hasSubmitted ? 'border-green-500' : 'border-gray-600'}`}>
                    <img 
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} 
                      alt="avatar" 
                      className={`w-12 h-12 rounded-full bg-gray-800 transition ${hasSubmitted ? 'opacity-50' : ''}`}
                    />
                    {hasSubmitted && (
                      <div className="absolute inset-0 flex items-center justify-center animate-pop-in">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_2px_6px_rgba(34,197,94,0.7)]">
                          <circle cx="14" cy="14" r="13" fill="#16a34a" stroke="#bbf7d0" strokeWidth="1.5"/>
                          <polyline points="7,14 12,19 21,9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    {p.isOnline === false && (
                      <div className="absolute -top-2 -right-2 bg-red-600 rounded text-xs px-1 font-bold animate-pulse">
                        Offline
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${p.isOnline === false ? 'text-red-400' : 'text-gray-400'}`}>{p.username}</span>
                </div>
              );
            })}
          </div>

          {/* Linear Countdown Bar */}
          <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden shadow-inner">
            <div 
              className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.max(0, (timeLeft / gameState.settings.timerSeconds) * 100)}%` }}
            ></div>
          </div>

          <div className="text-center bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-700 shadow-xl min-h-[160px] flex flex-col justify-center animate-flip-in">
            <div className="text-gray-400 mb-2 font-semibold uppercase tracking-widest text-sm">
              Category: <span className="font-bold text-white ml-1">{gameState.category}</span>
            </div>
            {myRoleData?.isChameleon ? (
              <div>
                <div className="text-gray-400 mb-1">The Secret Word is:</div>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-500 tracking-wider">???????</h3>
                <p className="text-red-400 font-bold mt-2 text-sm md:text-base uppercase tracking-wide">You are the Chameleon</p>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-1">The Secret Word is:</div>
                <h3 className="text-3xl md:text-4xl font-bold text-green-400 tracking-wider bg-green-900/30 inline-block px-4 py-2 rounded-lg">{myRoleData?.word}</h3>
                <p className="text-blue-400 font-bold mt-2 text-sm md:text-base uppercase tracking-wide">You are a Villager</p>
              </div>
            )}
            
            {/* 16 Words Board Grid */}
            {myRoleData?.boardWords && (
              <div className="mt-8 relative z-10">
                <h4 className="text-xl font-bold mb-4 text-gray-300">Board Words</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {myRoleData.boardWords.map((bw, idx) => {
                    const isSecret = !myRoleData.isChameleon && bw === myRoleData.word;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg border font-bold text-center transition-all ${
                          isSecret 
                            ? 'bg-green-600/30 border-green-400 text-green-300 shadow-[0_0_15px_rgba(74,222,128,0.3)]' 
                            : 'bg-gray-700/50 border-gray-600 text-gray-300'
                        }`}
                      >
                        {bw}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600">
              <h4 className="font-bold mb-4 text-xl">Clue Box</h4>
              {hasSubmittedClue ? (
                  <div className="text-green-400 font-bold text-center py-8 bg-gray-800 rounded border border-green-500/30 animate-pop-in">
                  <span className="inline-flex items-center gap-2">Clue submitted!
                    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline drop-shadow-[0_1px_4px_rgba(34,197,94,0.6)]">
                      <circle cx="14" cy="14" r="13" fill="#16a34a" stroke="#bbf7d0" strokeWidth="1.5"/>
                      <polyline points="7,14 12,19 21,9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span><br/>
                  <span className="text-gray-400 text-sm font-normal">Waiting for others...</span>
                </div>
              ) : (
                <form onSubmit={submitClue} className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    value={clueInput}
                    onChange={e => setClueInput(e.target.value)}
                    placeholder="Enter one word or short phrase..."
                    className="p-4 rounded-lg bg-gray-800 border border-gray-500 focus:outline-none focus:border-blue-500 text-lg shadow-inner"
                    maxLength={50}
                    required
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold text-lg shadow-md transition">Submit Clue</button>
                </form>
              )}

              {myRoleData?.isChameleon && (
                <div className="mt-6 p-4 border-2 border-dashed border-red-500/50 bg-red-900/20 rounded-lg">
                  <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                    <span>👁️</span> Chameleon Intel
                  </h4>
                  {chameleonPeek ? (
                    <p className="text-sm">Someone submitted: <span className="italic font-bold text-white text-lg">"{chameleonPeek.text}"</span></p>
                  ) : (
                    <p className="text-sm text-gray-500 italic animate-pulse">Waiting for a villager to submit a clue so you can peek...</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-inner">
              <h4 className="font-bold mb-4 text-gray-400">Live Feed (Villagers Only)</h4>
              {!myRoleData?.isChameleon ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                  {clueFeed.length === 0 && <div className="text-sm text-gray-500 italic">No clues submitted yet...</div>}
                  {clueFeed.map((c, i) => (
                    <div key={i} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex flex-col slide-in-bottom">
                      <span className="font-bold text-blue-400 text-xs mb-1 uppercase">{c.username}</span> 
                      <span className="italic text-lg">"{c.text}"</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-gray-600 italic gap-2 bg-gray-800/50 rounded-lg">
                  <span className="text-4xl">🙈</span>
                  Chameleons cannot see the live feed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {gameState.phase === 'discussion' && (
        <div className="flex flex-col gap-6">
          <div className="text-center relative flex flex-col md:block items-center gap-4">
            <h3 className="text-2xl font-bold mb-2">Discussion Phase</h3>
            <p className="text-gray-400">Review the clues and find the Chameleon!</p>
            <button 
              onClick={callVote}
              className="md:absolute right-0 top-0 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition shadow-md w-full md:w-auto"
            >
              Call a Vote Early
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gameState.fullClues?.map((c: any) => {
              const p = gameState.players.find((player: any) => player.id === c.userId);
              return (
                <div key={c.userId} className="bg-gray-700 p-4 rounded-xl text-center border border-gray-600">
                  <div className="font-bold text-blue-400 mb-2">{p?.username}</div>
                  <div className="text-xl italic">"{c.text}"</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gameState.phase === 'voting' && (
        <div className="flex flex-col gap-6 text-center">
          <h3 className="text-3xl font-bold text-red-500 mb-2">Vote!</h3>
          <p className="text-gray-400 mb-6">Who is the Chameleon?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {gameState.players.map((p: any) => {
              if (p.id === user.id) return null; // Don't vote for self
              const hasVoted = submittedPlayers.has(p.id);
              const isMyVote = myVote === p.id;
              
              return (
                <button 
                  key={p.id}
                  onClick={() => submitVote(p.id)}
                  disabled={myVote !== null}
                  className={`p-4 rounded-xl border transition flex flex-col items-center gap-2 ${
                    isMyVote ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 
                    myVote ? 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed' :
                    'bg-gray-700 hover:bg-gray-600 border-gray-600'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={p.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} 
                      alt="avatar" 
                      className={`w-16 h-16 rounded-full bg-gray-800 ${hasVoted ? 'border-2 border-green-500' : ''} ${p.isOnline === false ? 'opacity-30 grayscale' : ''}`}
                    />
                    {hasVoted && (
                      <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full w-6 h-6 flex items-center justify-center border border-green-500 shadow-md animate-pop-in">
                        <svg width="14" height="14" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="14" cy="14" r="13" fill="#16a34a"/>
                          <polyline points="7,14 12,19 21,9" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    {p.isOnline === false && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-red-900/80 text-white text-[10px] px-2 py-1 rounded">Offline</span>
                      </div>
                    )}
                  </div>
                  <span className={`font-bold mt-2 ${p.isOnline === false ? 'text-red-400 line-through' : ''}`}>{p.username}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState.phase === 'chameleon_guess' && (
        <div className="text-center py-6 md:py-12 flex flex-col gap-6">
          <h3 className="text-3xl md:text-4xl font-bold text-red-500">The Chameleon was caught!</h3>
          <p className="text-gray-300 text-base md:text-lg">But wait... they have one chance to guess the secret word and steal the points.</p>
          
          <div className="bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-700 inline-block mx-auto w-full md:min-w-[300px]">
            {myRoleData?.isChameleon ? (
              <form onSubmit={submitGuess} className="flex flex-col gap-4">
                <label className="font-bold text-xl text-white">What is the secret word?</label>
                <div className="text-sm text-gray-400 mb-2">Category: <span className="text-blue-400 font-bold">{gameState.category}</span></div>
                <input 
                  type="text" 
                  value={guessInput}
                  onChange={e => setGuessInput(e.target.value)}
                  placeholder="Type your guess..."
                  className="p-4 rounded-lg bg-gray-800 border border-gray-500 focus:outline-none focus:border-red-500 text-lg shadow-inner text-center"
                  maxLength={50}
                  required
                />
                <button type="submit" className="bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold text-lg shadow-md transition mt-2">
                  Submit Guess
                </button>
              </form>
            ) : (
              <div className="animate-pulse">
                <div className="text-4xl mb-4">🙈</div>
                <div className="font-bold text-xl text-yellow-500">The Chameleon is guessing...</div>
                <div className="text-gray-500 mt-2 text-sm">Hold your breath!</div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState.phase === 'reveal' && (
        <div className="text-center py-6 md:py-12 flex flex-col gap-6">
          <h3 className="text-4xl md:text-5xl font-bold mb-2">Round Over</h3>
          <div className={`bg-gray-900 p-6 md:p-8 rounded-xl border border-gray-700 inline-block mx-auto w-full md:min-w-[400px] shadow-2xl ${gameState.isChameleonEliminated ? '' : 'animate-shake border-red-500'}`}>
            {gameState.isChameleonEliminated ? (
              <div className="flex flex-col gap-4">
                <div className="text-green-400 text-2xl md:text-3xl font-bold animate-pop-in">The Villagers caught the Chameleon!</div>
                {gameState.chameleonGuessedCorrectly === true && (
                  <div className="text-red-400 text-xl font-bold mt-2 border-t border-gray-700 pt-4">
                    ...but the Chameleon correctly guessed the word!
                  </div>
                )}
                {gameState.chameleonGuessedCorrectly === false && (
                  <div className="text-blue-400 text-xl font-bold mt-2 border-t border-gray-700 pt-4">
                    ...and the Chameleon failed to guess the word!
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="text-red-500 text-3xl font-bold">The Chameleon Escaped!</div>
                <div className="text-gray-400 text-lg border-t border-gray-700 pt-4">
                  An innocent villager was eliminated.
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-lg mx-auto w-full">
            <h4 className="text-xl font-bold mb-4 text-gray-300">Scores</h4>
            <div className="space-y-3">
              {[...gameState.players].sort((a:any, b:any) => b.score - a.score).map((p: any) => (
                <div key={p.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
                  <span className="font-bold flex items-center gap-2">
                    {p.id === gameState.chameleonId && (
                      <span title="Chameleon">
                        {/* Hand-crafted chameleon silhouette */}
                        <svg width="22" height="22" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_4px_rgba(74,222,128,0.5)]">
                          {/* Body */}
                          <ellipse cx="48" cy="46" rx="26" ry="18" fill="#22c55e"/>
                          {/* Head */}
                          <ellipse cx="20" cy="38" rx="14" ry="12" fill="#16a34a"/>
                          {/* Crest / horn on top of head */}
                          <path d="M 14,28 C 16,18 22,16 24,26" fill="#15803d" />
                          {/* Eye ring */}
                          <circle cx="14" cy="36" r="6" fill="#bbf7d0" />
                          <circle cx="14" cy="36" r="3.5" fill="#166534" />
                          <circle cx="13" cy="35" r="1.2" fill="white" />
                          {/* Mouth / tongue */}
                          <path d="M 8,42 Q 4,48 2,46 Q 0,44 2,43" stroke="#f87171" strokeWidth="2" fill="none" strokeLinecap="round"/>
                          {/* Legs */}
                          <path d="M 36,62 L 32,76 M 52,64 L 50,78 M 62,58 L 66,72 M 44,63 L 42,77" stroke="#16a34a" strokeWidth="4" strokeLinecap="round"/>
                          {/* Tail */}
                          <path d="M 72,48 C 84,46 90,52 88,60 C 86,68 80,70 78,66" stroke="#22c55e" strokeWidth="5" fill="none" strokeLinecap="round"/>
                          {/* Scales hint */}
                          <ellipse cx="50" cy="38" rx="6" ry="4" fill="#16a34a" opacity="0.5"/>
                          <ellipse cx="62" cy="42" rx="5" ry="3.5" fill="#16a34a" opacity="0.5"/>
                        </svg>
                      </span>
                    )}
                    {p.username}
                  </span>
                  <span className="text-2xl font-black text-yellow-500">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-gray-500 mt-4 animate-pulse">Waiting for the next round...</p>
        </div>
      )}
    </div>
  );
}
