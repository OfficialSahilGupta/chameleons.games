import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import GameUI from '../components/GameUI';
import RoomSettingsModal from '../components/RoomSettingsModal';
import ChatPanel from '../components/ChatPanel';

export default function Room() {
  const { code } = useParams();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [error, setError] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [gamePhase, setGamePhase] = useState<string>('lobby');

  useEffect(() => {
    if (!token || !user) {
      navigate('/');
      return;
    }

    const newSocket = io('http://localhost:4001', {
      auth: { token },
    });
    setSocket(newSocket);

    // Initial fetch
    newSocket.emit('room:get', { code }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
      } else {
        setError(response.message);
      }
    });

    newSocket.on('room:stateUpdated', (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status === 'lobby') {
        setGamePhase('lobby');
      }
    });

    newSocket.on('game:state', (state) => {
      setGamePhase(state.phase);
    });

    newSocket.on('room:kicked', ({ kickedUserId }) => {
      if (user.id === kickedUserId) {
        alert('You were kicked by the host.');
        navigate('/lobby');
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [code, token, user, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center bg-gray-800 p-8 rounded-xl">
          <h2 className="text-2xl text-red-500 mb-4">Error Joining Room</h2>
          <p className="mb-6">{error}</p>
          <button onClick={() => navigate('/lobby')} className="bg-blue-600 px-6 py-2 rounded">Back to Lobby</button>
        </div>
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
  }

  const isHost = room.hostId._id === user?.id;
  const myPlayer = room.players.find((p: any) => p.userId._id === user?.id);
  const isReady = myPlayer?.isReady;
  
  const handleToggleReady = () => {
    socket?.emit('room:toggleReady', { code, isReady: !isReady });
  };

  const handleUpdateSettings = (newSettings: any) => {
    if (!isHost) return;
    // Optimistic UI update could go here, but we'll wait for server broadcast
    socket?.emit('room:updateSettings', { code, settings: newSettings });
    setIsSettingsModalOpen(false);
  };

  const handleStartGame = () => {
    if (!isHost) return;
    socket?.emit('room:startGame', { code }, (res: any) => {
      if (!res.success) alert(res.message);
    });
  };

  const handleKickPlayer = (targetUserId: string) => {
    if (!isHost) return;
    socket?.emit('room:kickPlayer', { code, targetUserId });
  };

  const allReady = room.players.every((p: any) => p.isReady || p.userId._id === room.hostId._id);
  const canStart = room.players.length >= room.settings.minPlayers && allReady;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div>
            <h1 className="text-3xl font-bold text-green-400">{room.name}</h1>
            <p className="text-gray-400 text-sm mt-1">Room Code: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-white tracking-wider">{room.code}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold uppercase ${room.status === 'lobby' ? 'bg-blue-900 text-blue-300' : 'bg-yellow-900 text-yellow-300'}`}>
              {room.status.replace('_', ' ')}
            </span>
            <button onClick={() => navigate('/lobby')} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">Leave</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          
          {/* Main Content Area */}
          <div className="md:col-span-3">
            {room.status !== 'lobby' ? (
              <GameUI socket={socket} code={code as string} user={user} room={room} />
            ) : (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                  <h2 className="text-2xl font-bold">Players <span className="text-gray-400 text-lg font-normal">({room.players.length}/{room.settings.maxPlayers})</span></h2>
                  {!isHost && room.status === 'lobby' && (
                    <button 
                      onClick={handleToggleReady}
                      className={`px-6 py-2 rounded font-bold transition ${isReady ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                    >
                      {isReady ? 'Unready' : 'Ready Up'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {room.players.map((p: any) => {
                    const isPlayerHost = p.userId._id === room.hostId._id;
                    return (
                      <div key={p.userId._id} className="flex items-center gap-4 bg-gray-700 p-3 rounded-lg border border-gray-600">
                        <img 
                          src={p.userId.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId.username}`} 
                          alt="avatar" 
                          className="w-12 h-12 rounded-full bg-gray-800"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-lg">{p.userId.username}</span>
                              {isPlayerHost && <span title="Host" className="text-yellow-400">👑</span>}
                              {p.userId._id === user?.id && <span className="text-xs text-gray-400">(You)</span>}
                            </div>
                            {isHost && !isPlayerHost && room.status === 'lobby' && (
                              <button 
                                onClick={() => handleKickPlayer(p.userId._id)}
                                className="text-xs bg-red-900/50 hover:bg-red-600 text-red-200 border border-red-800 hover:border-red-500 px-2 py-1 rounded transition"
                                title="Kick Player"
                              >
                                Kick
                              </button>
                            )}
                          </div>
                          <div className="text-sm">
                            {isPlayerHost ? (
                              <span className="text-blue-400">Host</span>
                            ) : (
                              <span className={p.isReady ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                                {p.isReady ? 'Ready' : 'Not Ready'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Empty Slots */}
                {Array.from({ length: Math.max(0, room.settings.maxPlayers - room.players.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="mt-4 p-4 border border-dashed border-gray-600 rounded-lg text-center text-gray-500 bg-gray-800/50">
                    Waiting for player...
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar: Settings & Chat */}
          <div className="md:col-span-1 flex flex-col gap-6 h-[80vh]">
            
            {room.status === 'lobby' && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl flex flex-col shrink-0">
                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                  <h2 className="text-xl font-bold">Room Rules</h2>
                  {isHost && (
                    <button 
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex justify-between border-b border-gray-700/50 pb-2">
                    <span className="text-gray-400">Max Players</span>
                    <span className="font-semibold">{room.settings.maxPlayers}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/50 pb-2">
                    <span className="text-gray-400">Rounds</span>
                    <span className="font-semibold">{room.settings.roundCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/50 pb-2">
                    <span className="text-gray-400">Turn Timer</span>
                    <span className="font-semibold">{room.settings.timerSeconds}s</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/50 pb-2">
                    <span className="text-gray-400">Turn Mode</span>
                    <span className="font-semibold capitalize">{room.settings.turnMode || 'Simultaneous'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/50 pb-2">
                    <span className="text-gray-400">Privacy</span>
                    <span className="font-semibold">{room.settings.isPrivate ? 'Private 🔒' : 'Public 🌍'}</span>
                  </div>
                </div>

                {isHost && (
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <button 
                      onClick={handleStartGame}
                      disabled={!canStart}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 font-bold py-3 rounded text-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:shadow-none transition-all"
                    >
                      Start Game
                    </button>
                    {!canStart && (
                      <p className="text-center text-xs text-gray-400 mt-2">
                        {room.players.length < room.settings.minPlayers 
                          ? `Need ${room.settings.minPlayers - room.players.length} more` 
                          : 'Waiting for Ready'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-h-[400px]">
              <ChatPanel 
                socket={socket} 
                code={code as string} 
                disabled={gamePhase === 'clue_writing'} 
              />
            </div>
            
          </div>
        </div>
      </div>

      {isHost && (
        <RoomSettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleUpdateSettings}
          initialSettings={room}
          isCreateMode={false}
        />
      )}
    </div>
  );
}
