import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuth(data.token, data.user);
        navigate('/lobby');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-6 text-green-400">CHAMELEON</h1>
        <p className="mb-8 text-gray-400">A Multiplayer Word Deduction Game</p>
        
        <form onSubmit={handleGuestLogin} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Choose a username..." 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Entering...' : 'Play as Guest'}
          </button>
        </form>
      </div>
    </div>
  );
}
