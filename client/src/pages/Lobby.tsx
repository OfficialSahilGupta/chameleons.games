import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import RoomSettingsModal from '../components/RoomSettingsModal';

export default function Lobby() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  
  // Filters
  const [filterJoinable, setFilterJoinable] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  
  // UI States
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (location.state?.errorMsg) {
      setErrorMsg(location.state.errorMsg);
      window.history.replaceState({}, document.title);
    }

    if (!token || !user) {
      navigate('/');
      return;
    }

    const newSocket = io(import.meta.env.PROD ? "" : "http://localhost:4001", {
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
    if (!socket || !user || !token) return;
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
    <div className="min-h-screen bg-[#050505] text-white p-8 relative overflow-hidden font-sans">
      
      <style>{`
        @keyframes camouflage {
          0% { filter: hue-rotate(0deg) brightness(1); }
          25% { filter: hue-rotate(90deg) brightness(1.2); }
          50% { filter: hue-rotate(180deg) brightness(0.9); }
          75% { filter: hue-rotate(270deg) brightness(1.1); }
          100% { filter: hue-rotate(360deg) brightness(1); }
        }
        .animate-camouflage {
          animation: camouflage 20s infinite linear;
        }
      `}</style>
      
      {/* Background Ambient Effects & Chameleon Art */}
      <div className="fixed top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-green-900/10 rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite] animate-camouflage pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[30%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      
      {/* Massive subtle chameleon graphic hanging in the background */}
      <svg className="fixed w-[800px] h-[800px] text-green-500/5 -left-32 top-10 -z-10 rotate-[-10deg] pointer-events-none drop-shadow-[0_0_50px_rgba(34,197,94,0.1)] animate-camouflage" viewBox="-30 -10 140 140" fill="currentColor">
        <path d="M 30,70 A 25,25 0 1,0 80,70 A 20,20 0 1,1 40,70 A 15,15 0 1,0 70,70 A 10,10 0 1,1 50,70" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M 30,70 C 10,80 0,60 10,40 C 20,10 50,15 50,45 C 50,60 40,70 30,70 Z" />
        <path d="M 22,18 C 25,-5 45,0 45,20 Z" />
        <circle cx="20" cy="35" r="7" fill="#050505" />
        <circle cx="18" cy="35" r="2.5" fill="currentColor" className="animate-[pulse_3s_ease-in-out_infinite]" />
        <path d="M 28,70 L 22,88 L 12,88 M 42,65 L 45,88 L 55,88" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 8,43 C -15,45 -10,30 -25,40" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="4 2" />
        <circle cx="-25" cy="40" r="3" />
      </svg>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-white/5 pb-6">
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

        <div className="flex flex-col md:flex-row gap-6">
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
