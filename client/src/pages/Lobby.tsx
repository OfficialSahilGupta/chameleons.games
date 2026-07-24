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
    <div className="h-[100dvh] bg-[#050505] text-white relative overflow-hidden font-sans flex flex-col">
      <style>{`
        @keyframes camouflage {
          0%   { filter: hue-rotate(0deg)   brightness(1);   }
          25%  { filter: hue-rotate(90deg)  brightness(1.2); }
          50%  { filter: hue-rotate(180deg) brightness(0.9); }
          75%  { filter: hue-rotate(270deg) brightness(1.1); }
          100% { filter: hue-rotate(360deg) brightness(1);   }
        }
        .animate-camouflage { animation: camouflage 20s infinite linear; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-panel {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 0 40px rgba(0,0,0,0.5);
        }
      `}</style>

      {/* ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-green-900/10 rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite] animate-camouflage pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[30%] w-[60vw] h-[60vw] bg-blue-900/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* watermark chameleon eye */}
      <div className="absolute bottom-10 right-10 pointer-events-none" style={{ opacity: 0.04 }}>
        <svg width="400" height="400" viewBox="0 0 200 220" fill="none" className="animate-camouflage">
          <ellipse cx="74" cy="128" rx="17" ry="19" fill="#14532d"/>
          <ellipse cx="74" cy="128" rx="13" ry="15" fill="#166534"/>
          <ellipse cx="74" cy="128" rx="9" ry="11" fill="#15803d"/>
          <ellipse cx="74" cy="128" rx="3" ry="9" fill="#020a02"/>
          <ellipse cx="77" cy="123" rx="2.5" ry="3.5" fill="white" opacity="0.35"/>
        </svg>
      </div>

      {/* HEADER */}
      <header className="flex-none p-6 md:px-12 flex justify-between items-center z-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex items-center group cursor-pointer relative" onClick={() => navigate('/')}>
          <div className="font-black text-2xl tracking-[0.2em] text-transparent bg-clip-text animate-camouflage"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 0a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6zm0 1.5a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5 4.5 4.5 0 0 1-4.5-4.5 4.5 4.5 0 0 1 4.5-4.5z\' fill=\'%23ffffff\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'/%3E%3C/svg%3E"), linear-gradient(to right, #4ade80, #60a5fa, #a855f7)' }}>
            CHAMELEON LOBBY
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user?.isAdmin && (
            <button onClick={() => navigate('/admin')} className="text-xs font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors">
              Admin
            </button>
          )}
          <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA (Scrollable internally) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar z-10 px-4 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">

          <div className="flex-1 w-full flex flex-col gap-6">
            
            {errorMsg && (
              <div className="glass-panel border-red-500/30 text-red-300 px-6 py-4 rounded-xl flex justify-between items-center animate-[fade-up_0.25s_ease]">
                <span className="font-semibold text-sm tracking-wide">{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="text-red-400 hover:text-white transition">&times;</button>
              </div>
            )}

            <div className="glass-panel rounded-2xl p-6 md:p-8 flex-1 min-h-[60vh]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-2xl font-bold tracking-wider">ACTIVE ROOMS <span className="text-green-500 text-lg ml-2">({filteredRooms.length})</span></h2>
                
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Custom Toggle Checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={filterJoinable} 
                      onChange={e => setFilterJoinable(e.target.checked)}
                    />
                    <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${filterJoinable ? 'bg-green-500/20 border border-green-500' : 'bg-black/30 border border-white/10'}`}>
                      <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-300 ${filterJoinable ? 'left-5.5 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)]' : 'left-1 bg-gray-500'}`} style={{ transform: filterJoinable ? 'translateX(18px)' : 'translateX(0)' }} />
                    </div>
                    <span className="text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-gray-200 transition">Joinable</span>
                  </label>

                  {/* Custom Glass Select */}
                  <div className="relative group">
                    <select 
                      value={filterCategory} 
                      onChange={e => setFilterCategory(e.target.value)}
                      className="appearance-none bg-black/20 border border-white/10 rounded-full px-5 py-2 text-xs font-bold tracking-widest text-gray-300 focus:outline-none focus:border-green-500 cursor-pointer hover:bg-white/5 transition pr-10"
                    >
                      <option value="" className="bg-gray-900">ALL CATEGORIES</option>
                      {activeCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-gray-900">{cat.toUpperCase()}</option>
                      ))}
                    </select>
                    <svg className="absolute right-4 top-2.5 w-3 h-3 text-gray-500 pointer-events-none group-hover:text-green-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRooms.length === 0 ? (
                  <div className="col-span-full text-center py-16 text-gray-500 font-light tracking-wide border border-dashed border-white/5 rounded-xl bg-black/10">
                    {rooms.length === 0 ? "NO ROOMS AVAILABLE. BE THE FIRST TO CREATE ONE." : "NO ROOMS MATCH YOUR FILTERS."}
                  </div>
                ) : (
                  filteredRooms.map(room => (
                    <div key={room._id} className="group relative bg-black/20 rounded-xl p-5 border border-white/5 hover:border-green-500/50 hover:bg-green-500/5 transition-all duration-300 flex flex-col justify-between h-40 overflow-hidden">
                      {/* Top status bar */}
                      <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className="flex items-center gap-2">
                          {room.settings.isPrivate && (
                            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                          <h3 className="font-bold text-lg text-white truncate max-w-[150px]">{room.name}</h3>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded font-bold tracking-widest uppercase ${room.status === 'lobby' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {room.status === 'lobby' ? 'WAITING' : 'PLAYING'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-4 z-10">
                        Host: <span className="text-gray-300">{room.hostId?.username || 'Unknown'}</span>
                      </div>

                      {/* Bottom action row */}
                      <div className="flex justify-between items-end mt-auto z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-500 tracking-widest uppercase">Players</span>
                          <span className="font-mono text-lg text-gray-200">{room.players.length}<span className="text-gray-600">/{room.settings.maxPlayers}</span></span>
                        </div>
                        <button 
                          onClick={() => joinRoom(room.code)}
                          disabled={room.players.length >= room.settings.maxPlayers}
                          className="bg-green-600/20 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/50 hover:border-green-500 disabled:bg-black/30 disabled:border-white/5 disabled:text-gray-600 text-xs font-bold py-2 px-6 rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0)] hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                        >
                          JOIN
                        </button>
                      </div>

                      {/* Card background styling element */}
                      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-green-500/5 rounded-full blur-xl group-hover:bg-green-500/10 transition-colors pointer-events-none" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: PROFILE & ACTIONS */}
          <div className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
            {/* Identity Card */}
            <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
              <div className="flex items-center gap-4 mb-2">
                <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={randomizeAvatar} title="Randomize Avatar">
                  <div className="w-14 h-14 rounded-full bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                    <img 
                      src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                      alt="avatar" 
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-900 rounded-full border border-gray-700 flex items-center justify-center group-hover:bg-green-900 group-hover:border-green-500 transition-colors">
                    <svg className="w-3 h-3 text-gray-400 group-hover:text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Your Profile</div>
                  <div className="text-xl font-black tracking-wide text-white">{user?.username}</div>
                </div>
              </div>
            </div>

            {/* Initiate Operation */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-4">Host a Game</h3>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>CREATE ROOM</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>

            {/* Infiltrate Room */}
            <div className="glass-panel rounded-2xl p-6">
              <h3 className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-4">Join Private Room</h3>
              <form 
                onSubmit={(e) => { e.preventDefault(); joinRoom(joinCode); }}
                className="flex flex-col gap-3"
              >
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="ENTER CODE (e.g. magenta-gecko)" 
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toLowerCase())}
                    maxLength={25}
                    className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-green-500 focus:bg-black/60 text-center font-mono text-lg tracking-[0.1em] sm:tracking-[0.2em] text-white transition-colors lowercase placeholder:text-gray-700 placeholder:text-xs placeholder:tracking-widest"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_15px_rgba(34,197,94,0.1)] transition-all" />
                </div>
                <button 
                  type="submit"
                  disabled={joinCode.length < 5}
                  className="w-full border border-white/20 hover:border-white/50 hover:bg-white/5 disabled:opacity-50 disabled:hover:border-white/20 disabled:hover:bg-transparent font-bold tracking-widest py-3 px-4 rounded-xl transition-all text-sm uppercase"
                >
                  Join Room
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
