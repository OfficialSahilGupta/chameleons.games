import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

export default function Lobby() {
  const { user, token, logout } = useAuthStore();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);

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

    return () => {
      newSocket.disconnect();
    };
  }, [token, user, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">Game Lobby</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img 
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} 
                alt="avatar" 
                className="w-10 h-10 rounded-full bg-gray-700"
              />
              <span className="font-semibold">{user?.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm bg-red-600 hover:bg-red-500 py-1 px-3 rounded"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="bg-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl mb-4 font-semibold border-b border-gray-700 pb-2">Open Rooms</h2>
          <div className="text-gray-400 py-8 text-center">
            {socket?.connected 
              ? 'You are connected to the server. Rooms will appear here soon.' 
              : 'Connecting to server...'}
          </div>
        </div>
      </div>
    </div>
  );
}
