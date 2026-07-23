import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import RoomSettingsModal from '../components/RoomSettingsModal';

export default function Lobby() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  
  // Filters
  const [filterJoinable, setFilterJoinable] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  
  // UI States
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/');
      return;
    }

    const newSocket = io('http://localhost:4001', {
      auth: { token },
    });
    
    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
      console.error('Socket connect error:', err);
      if (err.message.includes('Authentication error')) {
        logout();
        navigate('/');
      }
    });

    newSocket.on('rooms:update', (updatedRooms) => {
      setRooms(updatedRooms);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const createRoom = (settings: any) => {
    if (!socket) return;
    setErrorMsg('');
    socket.emit('rooms:create', settings, (response: any) => {
      if (response.success) {
        setIsCreateModalOpen(false);
        navigate(`/room/${response.roomCode}`);
      } else {
        setErrorMsg(response.message);
        setIsCreateModalOpen(false); // Close modal so they can see the error
      }
    });
  };

  const randomizeAvatar = () => {
    if (!socket || !user) return;
    const seed = Math.random().toString(36).substring(7);
    socket.emit('user:updateAvatar', { seed }, (response: any) => {
      if (response.success) {
        useAuthStore.getState().setAuth(token, { ...user, avatarUrl: response.avatarUrl });
      }
    });
  };

  const joinRoom = (code: string) => {
    if (!socket) return;
    setErrorMsg('');
    socket.emit('rooms:join', { code }, (response: any) => {
      if (response.success) {
        navigate(`/room/${response.roomCode}`);
      } else {
        setErrorMsg(response.message);
      }
    });
  };

  // Extract unique categories from active rooms for the filter
  const activeCategories = Array.from(new Set(rooms.flatMap(r => r.settings.enabledCategories)));

  const filteredRooms = rooms.filter(room => {
    if (filterJoinable && (room.status !== 'lobby' || room.players.length >= room.settings.maxPlayers)) return false;
    if (filterCategory && !room.settings.enabledCategories.includes(filterCategory)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-green-400">Chameleon Lobby</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-800 py-2 px-4 rounded-full border border-gray-700">
              <div className="relative group cursor-pointer" onClick={randomizeAvatar} title="Click to randomize avatar">
                <img 
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full bg-gray-700 transition group-hover:opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-xs">🎲</span>
                </div>
              </div>
              <span className="font-semibold text-gray-200">{user?.username}</span>
            </div>
            {user?.isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded transition"
              >
                Admin Panel
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition"
            >
              Logout
            </button>
          </div>
        </header>

        {errorMsg && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-8 flex justify-between items-center animate-shake">
            <span className="font-semibold">{errorMsg}</span>
            <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-red-200 text-xl leading-none">&times;</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Room List */}
          <div className="flex-1 bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-semibold">Open Rooms ({filteredRooms.length})</h2>
              
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input 
                    type="checkbox" 
                    checked={filterJoinable} 
                    onChange={e => setFilterJoinable(e.target.checked)}
                    className="rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                  />
                  Joinable Now
                </label>
                <select 
                  value={filterCategory} 
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded p-1 text-sm focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {activeCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {rooms.length === 0 ? "No active rooms right now." : "No rooms match your filters."}
                </div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room._id} className="bg-gray-700 rounded-lg p-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-gray-600 hover:border-green-500 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-green-300">{room.name}</h3>
                        {room.settings.isPrivate && <span className="text-xs bg-gray-900 px-2 py-1 rounded-full border border-gray-600" title="Private Room">🔒</span>}
                        <span className={`text-xs px-2 py-1 rounded-full ${room.status === 'lobby' ? 'bg-blue-900/50 text-blue-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                          {room.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">Host: {room.hostId?.username || 'Unknown'}</p>
                      {room.settings.enabledCategories.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Categories: {room.settings.enabledCategories.join(', ')}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-200">{room.players.length}<span className="text-gray-500 text-lg">/{room.settings.maxPlayers}</span></div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Players</div>
                      </div>
                      <button 
                        onClick={() => joinRoom(room.code)}
                        disabled={room.players.length >= room.settings.maxPlayers}
                        className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:text-gray-400 font-bold py-2 px-6 rounded transition"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="w-full md:w-72 flex flex-col gap-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 text-center">
              <h3 className="text-lg font-semibold mb-4">Start a Game</h3>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-green-600 hover:bg-green-500 font-bold py-3 px-4 rounded transition text-lg shadow-[0_0_15px_rgba(22,163,74,0.4)]"
              >
                + Create Room
              </button>
              <p className="text-xs text-gray-500 mt-3">Host a new game with custom rules</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700 text-center">
              <h3 className="text-lg font-semibold mb-4">Join Private Room</h3>
              <form 
                onSubmit={(e) => { e.preventDefault(); joinRoom(joinCode); }}
                className="flex flex-col gap-3"
              >
                <input 
                  type="text" 
                  placeholder="Enter 6-digit code" 
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500 text-center font-mono text-xl tracking-widest"
                />
                <button 
                  type="submit"
                  disabled={joinCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 font-bold py-2 px-4 rounded transition"
                >
                  Join By Code
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <RoomSettingsModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createRoom}
        isCreateMode={true}
        initialSettings={{ name: `${user?.username}'s Room` }}
      />
    </div>
  );
}
