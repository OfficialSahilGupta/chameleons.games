import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import GameUI from '../components/GameUI';

export default function Room() {
  const { code } = useParams();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState('');

  // Fetch categories for the settings panel
  useEffect(() => {
    fetch('http://localhost:4001/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));
  }, []);

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

  const handleUpdateSettings = (key: string, value: any) => {
    if (!isHost) return;
    const newSettings = { ...room.settings, [key]: value };
    // Optimistic UI update could go here, but we'll wait for server broadcast
    socket?.emit('room:updateSettings', { code, settings: newSettings });
  };

  const handleToggleCategory = (catName: string) => {
    if (!isHost) return;
    const currentCats = room.settings.enabledCategories || [];
    let newCats;
    if (currentCats.includes(catName)) {
      newCats = currentCats.filter((c: string) => c !== catName);
    } else {
      newCats = [...currentCats, catName];
    }
    handleUpdateSettings('enabledCategories', newCats);
  };

  const handleStartGame = () => {
    if (!isHost) return;
    socket?.emit('room:startGame', { code }, (res: any) => {
      if (!res.success) alert(res.message);
    });
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

        {room.status !== 'lobby' ? (
          <GameUI socket={socket} code={code as string} user={user} room={room} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Players List */}
            <div className="md:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
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
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{p.userId.username}</span>
                        {isPlayerHost && <span title="Host" className="text-yellow-400">👑</span>}
                        {p.userId._id === user?.id && <span className="text-xs text-gray-400">(You)</span>}
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

          {/* Settings Panel */}
          <div className="md:col-span-1 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl flex flex-col">
            <h2 className="text-2xl font-bold mb-6 border-b border-gray-700 pb-2">Room Settings</h2>
            
            <div className="flex flex-col gap-5 flex-1">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Max Players</label>
                <input 
                  type="number" 
                  min="3" max="12" 
                  disabled={!isHost}
                  value={room.settings.maxPlayers}
                  onChange={e => handleUpdateSettings('maxPlayers', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Number of Rounds</label>
                <input 
                  type="number" 
                  min="1" max="10" 
                  disabled={!isHost}
                  value={room.settings.roundCount}
                  onChange={e => handleUpdateSettings('roundCount', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Turn Timer (seconds)</label>
                <select 
                  disabled={!isHost}
                  value={room.settings.timerSeconds}
                  onChange={e => handleUpdateSettings('timerSeconds', parseInt(e.target.value))}
                  className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:outline-none focus:border-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <option value="15">15 Seconds (Fast)</option>
                  <option value="30">30 Seconds (Normal)</option>
                  <option value="45">45 Seconds (Relaxed)</option>
                  <option value="60">60 Seconds (Slow)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300">
                  <input 
                    type="checkbox"
                    disabled={!isHost}
                    checked={room.settings.isPrivate}
                    onChange={e => handleUpdateSettings('isPrivate', e.target.checked)}
                    className="rounded bg-gray-700 border-gray-600 disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                  Private Room (Requires Code)
                </label>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">Enabled Categories</label>
                <div className="bg-gray-700 border border-gray-600 rounded p-3 max-h-32 overflow-y-auto space-y-2">
                  {categories.length === 0 && <div className="text-gray-500 text-sm text-center">Loading...</div>}
                  {categories.map(cat => (
                    <label key={cat._id} className={`flex items-center gap-2 text-sm ${!isHost ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}>
                      <input 
                        type="checkbox"
                        disabled={!isHost}
                        checked={(room.settings.enabledCategories || []).includes(cat.name)}
                        onChange={() => handleToggleCategory(cat.name)}
                        className="rounded bg-gray-800 border-gray-600 focus:ring-green-500"
                      />
                      {cat.name} <span className="text-xs text-gray-500">({cat.words.length} words)</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {isHost && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <button 
                  onClick={handleStartGame}
                  disabled={!canStart}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 font-bold py-4 rounded text-xl shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:shadow-none transition-all"
                >
                  Start Game
                </button>
                {!canStart && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    {room.players.length < room.settings.minPlayers 
                      ? `Need at least ${room.settings.minPlayers} players` 
                      : 'Waiting for all players to be Ready'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
