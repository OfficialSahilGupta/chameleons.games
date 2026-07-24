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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<{id: string, text: string}[]>([]);

  useEffect(() => {
    if (!token || !user) {
      navigate('/');
      return;
    }

    const newSocket = io(import.meta.env.PROD ? "" : "http://localhost:4001", {
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
      const currentUserId = (user as any)?._id || user?.id;
      if (String(currentUserId) === String(kickedUserId)) {
        navigate('/lobby', { state: { errorMsg: 'You have been kicked out of the room. Please create or join another room.' } });
      }
    });

    newSocket.on('room:notification', ({ text }) => {
      const id = Math.random().toString(36).substring(7);
      setNotifications(prev => [...prev, { id, text }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
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

  const currentUserId = (user as any)?._id || user?.id;
  const isHost = String(room.hostId._id || room.hostId) === String(currentUserId);
  const myPlayer = room.players.find((p: any) => String(p.userId._id || p.userId) === String(currentUserId));
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
    setSelectedPlayerId(null);
  };

  const handleTransferHost = (targetUserId: string) => {
    if (!isHost) return;
    socket?.emit('room:transferHost', { code, targetUserId }, (res: any) => {
      if (!res.success) {
        alert(res.message);
      } else {
        setSelectedPlayerId(null);
      }
    });
  };

  const handleLeaveRoom = () => {
    socket?.emit('room:leave', { code }, () => {
      navigate('/lobby');
    });
  };

  const allReady = room.players.every((p: any) => p.isReady || p.userId._id === room.hostId._id);
  const canStart = room.players.length >= room.settings.minPlayers && allReady;

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-slate-900 to-slate-950 text-white relative overflow-hidden font-sans flex flex-col">
      <style>{`
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

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className="bg-slate-800/90 border border-slate-700/50 backdrop-blur-xl text-white px-5 py-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-sm font-bold tracking-wide animate-[fade-up_0.3s_ease-out] flex items-center gap-3">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {n.text}
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header className="flex-none p-6 md:px-12 flex justify-between items-center z-20 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="flex flex-col">
          <div className="font-black text-2xl tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 uppercase">
            {room.name}
          </div>
          <div className="text-xs text-gray-500 font-bold tracking-widest mt-1">
            CODE: <span className="text-green-400 font-mono bg-green-900/20 px-2 py-0.5 rounded border border-green-500/20 ml-2">{room.code}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`hidden sm:inline-block text-[10px] px-3 py-1.5 rounded-full font-bold tracking-widest uppercase ${room.status === 'lobby' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
            {room.status === 'lobby' ? 'WAITING IN LOBBY' : 'IN GAME'}
          </span>
          <button onClick={handleLeaveRoom} className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 transition-colors ml-4">
            Leave
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 overflow-hidden p-6 md:p-8 z-10 flex flex-col">
        <div className="max-w-7xl mx-auto w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col min-h-[60vh] lg:min-h-0 h-full">
            {room.status !== 'lobby' ? (
              <GameUI socket={socket} code={code as string} user={user} room={room} />
            ) : (
              <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col h-full min-h-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/5 pb-6 gap-4 shrink-0">
                  <h2 className="text-2xl font-bold tracking-wider">PLAYERS <span className="text-green-500 text-lg ml-2">({room.players.length}/{room.settings.maxPlayers})</span></h2>
                  {!isHost && room.status === 'lobby' && (
                    <button 
                      onClick={handleToggleReady}
                      className={`px-8 py-3 rounded-xl font-black text-xs tracking-widest uppercase transition-all hover:scale-105 ${isReady ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-green-500/20 text-green-400 border border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]'}`}
                    >
                      {isReady ? 'UNREADY' : 'READY UP'}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {room.players.map((p: any) => {
                    const isPlayerHost = String(p.userId._id || p.userId) === String(room.hostId._id || room.hostId);
                    const isSelected = String(selectedPlayerId) === String(p.userId._id || p.userId);
                    const playerUserIdStr = String(p.userId._id || p.userId);
                    
                    return (
                      <div 
                        key={playerUserIdStr} 
                        className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${
                          isSelected ? 'bg-slate-800/80 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-slate-800/30 border-slate-700/50 hover:border-green-500/50 hover:bg-slate-800/50'
                        }`}
                        onClick={() => setSelectedPlayerId(isSelected ? null : playerUserIdStr)}
                      >
                        <div className="relative">
                          <img 
                            src={p.userId.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId.username}`} 
                            alt="avatar" 
                            className="w-12 h-12 rounded-full bg-black/40 border border-white/10"
                          />
                          {isPlayerHost && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1 shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                              <svg className="w-3 h-3 text-black" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7.4-6.3-4.8-6.3 4.8 2.3-7.4-6-4.6h7.6z"/></svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white truncate">{p.userId.username}</span>
                            {playerUserIdStr === String(currentUserId) && <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">(You)</span>}
                          </div>
                          
                          {!isSelected && (
                            <div className="text-xs mt-1 font-bold tracking-widest uppercase">
                              {isPlayerHost ? (
                                <span className="text-yellow-400">Host</span>
                              ) : (
                                <span className={p.isReady ? 'text-green-400' : 'text-gray-500'}>
                                  {p.isReady ? 'Ready' : 'Waiting'}
                                </span>
                              )}
                            </div>
                          )}

                          {isSelected && (
                            <div className="flex items-center gap-2 mt-2">
                              {isHost && !isPlayerHost && room.status === 'lobby' ? (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleKickPlayer(playerUserIdStr); }} className="text-[10px] bg-red-900/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500 px-3 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)] hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:scale-105 uppercase font-black tracking-widest flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    KICK
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); handleTransferHost(playerUserIdStr); }} className="text-[10px] bg-yellow-900/60 hover:bg-yellow-500 text-yellow-300 hover:text-black border border-yellow-500/30 hover:border-yellow-500 px-3 py-1.5 rounded-lg transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)] hover:shadow-[0_0_15px_rgba(234,179,8,0.5)] hover:scale-105 uppercase font-black tracking-widest flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                    MAKE HOST
                                  </button>
                                </>
                              ) : (
                                <span className="text-[9px] text-gray-500 tracking-widest uppercase">
                                  {isPlayerHost ? 'Room Admin' : 'No Actions Available'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* ROOM RULES & START GAME FOOTER */}
                <div className="mt-6 pt-6 border-t border-white/5 shrink-0">
                  <div className="bg-slate-950/60 rounded-2xl p-5 md:p-6 border border-white/5 shadow-inner flex flex-col xl:flex-row justify-between items-center gap-8">
                    
                    {/* Stats Grid */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Room Configuration
                        </h3>
                        {isHost && (
                          <button onClick={() => setIsSettingsModalOpen(true)} className="text-[10px] text-green-400 hover:text-green-300 font-bold tracking-widest uppercase transition-colors bg-green-900/20 px-3 py-1 rounded-full border border-green-500/20 hover:border-green-500/50">EDIT SETTINGS</button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Capacity</span>
                          <span className="text-white font-mono font-bold">{room.settings.maxPlayers} <span className="text-[10px] text-gray-500 font-sans tracking-widest uppercase">Max</span></span>
                        </div>
                        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Rounds</span>
                          <span className="text-white font-mono font-bold">{room.settings.roundCount} <span className="text-[10px] text-gray-500 font-sans tracking-widest uppercase">Total</span></span>
                        </div>
                        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Timer</span>
                          <span className="text-emerald-400 font-mono font-bold">{room.settings.timerSeconds}s</span>
                        </div>
                        <div className="bg-slate-900/80 rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                          <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Mode</span>
                          <span className="text-yellow-400 font-mono font-bold capitalize truncate">{room.settings.turnMode || 'Simultaneous'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Block */}
                    {isHost && (
                      <div className="flex flex-col w-full xl:w-[280px] shrink-0 border-t xl:border-t-0 xl:border-l border-white/5 pt-6 xl:pt-0 xl:pl-8">
                        <button 
                          onClick={handleStartGame}
                          disabled={!canStart}
                          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-600 disabled:border-transparent text-black font-black py-4 px-6 rounded-xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)] disabled:shadow-none hover:shadow-[0_0_40px_rgba(74,222,128,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 flex items-center justify-center gap-2 border border-green-400"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          START MATCH
                        </button>
                        {!canStart && (
                          <div className="text-center text-[10px] font-bold tracking-widest uppercase text-yellow-500/80 mt-3 flex items-center justify-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {room.players.length < room.settings.minPlayers 
                              ? `Need ${room.settings.minPlayers - room.players.length} more players` 
                              : 'Waiting for players to ready up'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-[600px] lg:h-full min-h-0">
            <div className="w-full h-full glass-panel rounded-2xl overflow-hidden flex flex-col shadow-2xl">
              <ChatPanel 
                socket={socket} 
                code={code as string} 
                disabled={gamePhase === 'clue_writing'}
                players={room.players.map((p: any) => p.userId.username)}
                currentUsername={user?.username}
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
