import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuth(data.token, data.user);
        navigate('/lobby');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
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
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row relative overflow-hidden font-sans">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-green-900/10 rounded-full blur-[150px] mix-blend-screen animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[30%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      
      {/* Top Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="font-bold text-xl tracking-widest text-white/50">CHAMELEON</div>
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={() => { setMode('login'); setUsername(''); setPassword(''); }}
            className={`font-bold transition-colors ${mode === 'login' ? 'text-green-400' : 'text-gray-400 hover:text-white'}`}
          >
            Login
          </button>
          <button 
            onClick={() => { setMode('register'); setUsername(''); setPassword(''); }}
            className={`font-bold transition-colors px-4 py-2 rounded-full border ${mode === 'register' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-gray-600 text-gray-300 hover:text-white hover:border-gray-400'}`}
          >
            Register
          </button>
        </div>
      </div>

      {/* Left/Middle: The Vibe */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24 pt-28 md:pt-0 z-10">
        <div className="max-w-2xl">
          <div className="inline-block px-4 py-2 mb-8 border border-green-500/30 bg-green-500/10 text-green-400 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            A Psychological Game of Deception
          </div>
          
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.05] tracking-tighter">
            TRUST <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-gray-500 via-gray-300 to-white">NO ONE.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-12 leading-relaxed max-w-xl font-light">
            A secret word is shared among everyone—except the <strong className="text-green-500 font-bold">Chameleon</strong>. 
            Blend in, manipulate the truth, or hunt down the liar before they steal the game. 
            Are you a villager, or are you hiding in plain sight?
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => { setMode('guest'); document.getElementById('login-username')?.focus(); }}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(22,163,74,0.3)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Play Deception
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <button 
              onClick={() => alert("HOW TO PLAY:\n\n1. Everyone gets a secret word except the Chameleon.\n2. Each player says one related word to prove they know the secret.\n3. The Chameleon must deduce the word and blend in.\n4. Vote out the Chameleon, or the Chameleon wins if they guess the word!")}
              className="px-8 py-4 bg-transparent border border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 text-gray-300 hover:text-white font-bold rounded-xl transition-all"
            >
              Learn in 2 Minutes
            </button>
          </div>
        </div>
      </div>
      
      {/* Right: Login/Register Panel */}
      <div className="w-full md:w-[450px] lg:w-[500px] bg-[#0a0a0a]/90 backdrop-blur-2xl border-l border-white/5 p-8 md:p-12 flex flex-col justify-center z-10 mt-12 md:mt-0 relative shadow-2xl shadow-black overflow-y-auto">
        
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>

        <div className="relative z-10">
          
          {mode === 'guest' && (
            <>
              <h2 className="text-3xl font-bold mb-2 text-white">Join the Shadows</h2>
              <p className="text-gray-400 mb-10 text-sm">Enter a moniker to mask your true identity.</p>
              
              <form onSubmit={handleGuestLogin} className="flex flex-col gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Alias / Username</label>
                  <input 
                    id="login-username"
                    type="text" 
                    placeholder="e.g. Phantom, Cipher, Nobody..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all shadow-inner"
                    required
                    maxLength={15}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-2 bg-white text-black hover:bg-gray-200 font-extrabold text-lg py-4 px-4 rounded-xl transition-all disabled:opacity-50 flex justify-center items-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  {loading ? 'Infiltrating...' : 'Enter the Game'}
                  {!loading && (
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
                
                <div className="mt-8 text-center pt-8 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-4">Want to save your stats and avatar?</p>
                  <button 
                    type="button" 
                    onClick={() => { setMode('register'); setUsername(''); setPassword(''); }}
                    className="text-green-400 font-bold hover:text-green-300 underline"
                  >
                    Create a free account
                  </button>
                </div>
              </form>
            </>
          )}

          {mode === 'register' && (
            <>
              <h2 className="text-3xl font-bold mb-2 text-white">Register <span className="text-green-400">– without email!</span></h2>
              <div className="text-gray-400 mb-6 text-sm bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="mb-2 font-bold text-gray-300">Creating an account allows you to:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Add friends</li>
                  <li>Track personal stats</li>
                  <li>Upload your custom avatar</li>
                  <li>Complete quests and earn rewards</li>
                </ul>
              </div>
              
              <form onSubmit={handleRegister} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all shadow-inner"
                    required
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500">Needs to be unique, no spaces or special characters</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all shadow-inner"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">Needs to be at least 8 characters</p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-2 bg-green-600 text-white hover:bg-green-500 font-extrabold text-lg py-4 px-4 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                >
                  {loading ? 'Registering...' : 'Create account'}
                </button>
                
                <p className="text-xs text-yellow-500/80 bg-yellow-500/10 p-3 rounded border border-yellow-500/20 mt-2">
                  Because there is no email, it is highly recommended that you store your password with the help of your browser after you register.
                </p>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-400">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setMode('login'); setUsername(''); setPassword(''); }} className="text-green-400 font-bold hover:underline">
                      Login here.
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}

          {mode === 'login' && (
            <>
              <h2 className="text-3xl font-bold mb-2 text-white">Welcome Back</h2>
              <p className="text-gray-400 mb-8 text-sm">Sign in to continue your deception.</p>
              
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all shadow-inner"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all shadow-inner"
                    required
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-4 bg-white text-black hover:bg-gray-200 font-extrabold text-lg py-4 px-4 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Login'}
                </button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setMode('register'); setUsername(''); setPassword(''); }} className="text-green-400 font-bold hover:underline">
                      Register here.
                    </button>
                  </p>
                </div>
              </form>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}
