import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface GameUIProps {
  socket: Socket | null;
  code: string;
  user: any;
  room: any;
}

export default function GameUI({ socket, code, user, room }: GameUIProps) {
  const [gameState, setGameState] = useState<any>(null);
  const [myRoleData, setMyRoleData] = useState<{ category: string, word: string | null, isChameleon: boolean } | null>(null);
  const [clueInput, setClueInput] = useState('');
  const [guessInput, setGuessInput] = useState('');
  const [myVote, setMyVote] = useState<string | null>(null);
  const [hasSubmittedClue, setHasSubmittedClue] = useState(false);
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
    });

    socket.on('vote:submitted', (data) => {
      setSubmittedPlayers(prev => new Set(prev).add(data.userId));
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
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
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

  if (!gameState) {
    return <div className="text-center mt-20 text-xl animate-pulse">Initializing Game Engine...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-700">
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl drop-shadow-md">✅</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-semibold">{p.username}</span>
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

          <div className="text-center bg-gray-900 p-8 rounded-2xl border border-gray-700 shadow-xl min-h-[160px] flex flex-col justify-center">
            <div className="text-gray-400 mb-2 font-semibold uppercase tracking-widest text-sm">
              Category: <span className="font-bold text-white ml-1">{gameState.category}</span>
            </div>
            {myRoleData?.isChameleon ? (
              <div>
                <div className="text-gray-400 mb-1">The Secret Word is:</div>
                <h3 className="text-4xl font-bold text-gray-500 tracking-wider">???????</h3>
                <p className="text-red-400 font-bold mt-2 text-sm uppercase tracking-wide">You are the Chameleon</p>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-1">The Secret Word is:</div>
                <h3 className="text-4xl font-bold text-green-400 tracking-wider">{myRoleData?.word}</h3>
                <p className="text-blue-400 font-bold mt-2 text-sm uppercase tracking-wide">You are a Villager</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-700 p-6 rounded-xl shadow-lg border border-gray-600">
              <h4 className="font-bold mb-4 text-xl">Clue Box</h4>
              {hasSubmittedClue ? (
                <div className="text-green-400 font-bold text-center py-8 bg-gray-800 rounded border border-green-500/30">
                  Clue submitted! ✅<br/>
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
          <div className="text-center relative">
            <h3 className="text-2xl font-bold mb-2">Discussion Phase</h3>
            <p className="text-gray-400">Review the clues and find the Chameleon!</p>
            <button 
              onClick={callVote}
              className="absolute right-0 top-0 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition shadow-md"
            >
              Call a Vote Early
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      className={`w-16 h-16 rounded-full bg-gray-800 ${hasVoted ? 'border-2 border-green-500' : ''}`}
                    />
                    {hasVoted && (
                      <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full w-6 h-6 flex items-center justify-center border border-green-500 text-xs shadow-md">
                        ✅
                      </div>
                    )}
                  </div>
                  <span className="font-bold mt-2">{p.username}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {gameState.phase === 'chameleon_guess' && (
        <div className="text-center py-12 flex flex-col gap-6">
          <h3 className="text-4xl font-bold text-red-500">The Chameleon was caught!</h3>
          <p className="text-gray-300 text-lg">But wait... they have one chance to guess the secret word and steal the points.</p>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 inline-block mx-auto min-w-[300px]">
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
        <div className="text-center py-12 flex flex-col gap-6">
          <h3 className="text-5xl font-bold mb-2">Round Over</h3>
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-700 inline-block mx-auto min-w-[400px]">
            {gameState.isChameleonEliminated ? (
              <div className="flex flex-col gap-4">
                <div className="text-green-400 text-3xl font-bold">The Villagers caught the Chameleon!</div>
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
                    {p.id === gameState.chameleonId && <span title="Chameleon">🦎</span>}
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
