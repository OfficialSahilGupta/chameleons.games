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
      const response = await fetch((import.meta.env.PROD ? "" : "http://localhost:4001") + '/api/auth/guest', {
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
      const response = await fetch((import.meta.env.PROD ? "" : "http://localhost:4001") + '/api/auth/register', {
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
      const response = await fetch((import.meta.env.PROD ? "" : "http://localhost:4001") + '/api/auth/login', {
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
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-green-900/20 rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite] animate-camouflage pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[30%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none"></div>
      
      {/* Massive subtle chameleon graphic hanging in the background */}
      <svg className="absolute w-[800px] h-[800px] text-green-500/5 -left-32 top-10 -z-10 rotate-[-10deg] pointer-events-none drop-shadow-[0_0_50px_rgba(34,197,94,0.1)] animate-camouflage" viewBox="-30 -10 140 140" fill="currentColor">
        {/* Curled Tail */}
        <path d="M 30,70 A 25,25 0 1,0 80,70 A 20,20 0 1,1 40,70 A 15,15 0 1,0 70,70 A 10,10 0 1,1 50,70" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        {/* Main Body */}
        <path d="M 30,70 C 10,80 0,60 10,40 C 20,10 50,15 50,45 C 50,60 40,70 30,70 Z" />
        {/* Head Casque (Crest) */}
        <path d="M 22,18 C 25,-5 45,0 45,20 Z" />
        {/* Chameleon Eye (Swiveling) */}
        <circle cx="20" cy="35" r="7" fill="#050505" />
        <circle cx="18" cy="35" r="2.5" fill="currentColor" className="animate-[pulse_3s_ease-in-out_infinite]" />
        {/* Front & Back Legs */}
        <path d="M 28,70 L 22,88 L 12,88 M 42,65 L 45,88 L 55,88" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Extended Tongue */}
        <path d="M 8,43 C -15,45 -10,30 -25,40" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="4 2" />
        <circle cx="-25" cy="40" r="3" />
      </svg>
      
      {/* Top Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="ml-6 md:ml-12 flex items-center drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] group cursor-pointer relative">
          
          {/* The Chameleon 'C' */}
          <svg viewBox="0 0 100 100" className="w-9 h-9 -mr-[2px] -mt-1 z-20 text-green-400 animate-camouflage transform group-hover:-translate-y-1 transition-transform duration-300" fill="currentColor" style={{ filter: 'brightness(1.1)' }}>
            {/* Body & Tail (forming the C) */}
            <path d="M 85,25 C 50,5 15,10 10,50 C 5,85 40,95 70,85 C 85,80 90,65 75,60 C 60,55 50,65 55,75 C 60,80 70,80 70,75" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            {/* Head */}
            <path d="M 75,10 C 95,0 100,25 85,35 Z" fill="currentColor" />
            {/* Eye */}
            <circle cx="88" cy="18" r="4" fill="#050505" />
            <circle cx="89" cy="18" r="1.5" fill="currentColor" className="animate-[pulse_2s_ease-in-out_infinite]" />
            {/* Legs */}
            <path d="M 35,20 L 25,35 M 60,12 L 65,30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          </svg>

          {/* The Long Shooting Tongue (hidden normally, scales out on hover) */}
          <div className="absolute left-[30px] top-[10px] w-[185px] h-[3px] bg-green-400 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[400ms] ease-out z-10 animate-camouflage" />
          {/* The Sticky Tongue Tip */}
          <div className="absolute left-[215px] top-[8.5px] w-[8px] h-[6px] bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[300ms] z-10 animate-camouflage" />

          {/* The rest of the word with a scaly texture */}
          <div 
            className="font-black text-2xl tracking-[0.2em] text-transparent bg-clip-text animate-camouflage z-30"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 0a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6zm0 1.5a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5 4.5 4.5 0 0 1-4.5-4.5 4.5 4.5 0 0 1 4.5-4.5z\' fill=\'%23ffffff\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'/%3E%3C/svg%3E"), linear-gradient(to right, #4ade80, #60a5fa, #a855f7)'
            }}
          >
            HAMELEONS
          </div>

          {/* The Target Fly (buzzing around at the end, disappears when eaten) */}
          <svg className="absolute -right-6 top-1.5 w-4 h-4 text-gray-400 animate-pulse group-hover:opacity-0 transition-opacity duration-75 delay-[350ms]" viewBox="0 0 24 24">
            <path d="M12 10c-3-4-7-6-9-4 1 3 5 5 9 4z" fill="white" opacity="0.6"/>
            <path d="M12 10c3-4 7-6 9-4-1 3-5 5-9 4z" fill="white" opacity="0.6"/>
            <ellipse cx="12" cy="14" rx="2" ry="4" fill="currentColor"/>
          </svg>

        </div>
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
      
      {/* ─── Right: Redesigned Auth Panel ─── */}
      <div className="w-full md:w-[450px] lg:w-[500px] flex flex-col justify-center z-10 mt-12 md:mt-0 relative overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #0c0c0c 0%, #080808 60%, #0a0f0a 100%)' }}>

        {/* Top glow strip — light leaking under a door */}
        <div className="absolute top-0 left-0 right-0 h-[2px] z-30"
          style={{ background: 'linear-gradient(90deg, transparent 0%, #22c55e55 30%, #4ade8099 55%, #22c55e55 80%, transparent 100%)' }} />
        <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-20"
          style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.06) 0%, transparent 100%)' }} />

        {/* Left border accent */}
        <div className="absolute top-0 left-0 bottom-0 w-[1px]"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(34,197,94,0.25) 30%, rgba(34,197,94,0.1) 70%, transparent 100%)' }} />

        {/* Hex-scale SVG texture — like chameleon skin */}
        <div className="absolute inset-0 opacity-[0.025] pointer-events-none z-0 overflow-hidden">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hex" x="0" y="0" width="28" height="32" patternUnits="userSpaceOnUse">
                <polygon points="14,2 26,9 26,23 14,30 2,23 2,9" fill="none" stroke="#4ade80" strokeWidth="0.8"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex)" />
          </svg>
        </div>

        {/* Watching chameleon eye — top-right corner, almost invisible */}
        <div className="absolute top-6 right-6 opacity-[0.07] pointer-events-none z-0">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Orbital eye ring */}
            <circle cx="36" cy="36" r="34" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeDasharray="6 4"/>
            {/* Outer iris */}
            <circle cx="36" cy="36" r="22" fill="#166534" />
            {/* Iris pattern rings */}
            <circle cx="36" cy="36" r="18" stroke="#22c55e" strokeWidth="0.8" fill="none" />
            <circle cx="36" cy="36" r="13" stroke="#4ade80" strokeWidth="0.6" fill="none" />
            {/* Pupil — vertical slit like a chameleon */}
            <ellipse cx="36" cy="36" rx="5" ry="16" fill="#040a04" />
            {/* Catchlight */}
            <ellipse cx="39" cy="30" rx="3" ry="4" fill="white" opacity="0.35"/>
            {/* Outer glow ring */}
            <circle cx="36" cy="36" r="34" stroke="#22c55e" strokeWidth="0.4" fill="none" opacity="0.5"/>
          </svg>
        </div>

        <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-full">

          {/* ── Sliding Tab Switcher ── */}
          <style>{`
            @keyframes panel-fade-up {
              from { opacity: 0; transform: translateY(10px); }
              to   { opacity: 1; transform: translateY(0); }
            }
            .panel-content { animation: panel-fade-up 0.3s ease forwards; }

            .auth-input { position: relative; }
            .auth-input input:focus + .input-accent { transform: scaleY(1); }
            .input-accent {
              position: absolute; left: 0; top: 4px; bottom: 4px;
              width: 3px; border-radius: 2px;
              background: linear-gradient(180deg, #4ade80, #22c55e);
              transform: scaleY(0); transform-origin: bottom;
              transition: transform 0.25s ease;
            }

            @keyframes btn-pulse {
              0%, 100% { box-shadow: 0 0 18px rgba(34,197,94,0.3); }
              50%       { box-shadow: 0 0 32px rgba(34,197,94,0.55); }
            }
            .btn-glow-green { animation: btn-pulse 2.5s ease-in-out infinite; }

            @keyframes btn-pulse-white {
              0%, 100% { box-shadow: 0 0 18px rgba(255,255,255,0.08); }
              50%       { box-shadow: 0 0 28px rgba(255,255,255,0.18); }
            }
            .btn-glow-white { animation: btn-pulse-white 2.5s ease-in-out infinite; }
          `}</style>

          <div className="relative flex rounded-xl overflow-hidden mb-8 bg-white/5 border border-white/8 p-1 gap-1">
            {([['guest','Infiltrate'],['login','Sign In'],['register','Register']] as const).map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setUsername(''); setPassword(''); }}
                className="flex-1 relative py-2.5 text-xs font-bold tracking-widest uppercase transition-all duration-300 rounded-lg"
                style={{
                  color: mode === m ? '#fff' : 'rgba(156,163,175,0.7)',
                  background: mode === m ? 'linear-gradient(135deg, rgba(34,197,94,0.25) 0%, rgba(16,85,47,0.35) 100%)' : 'transparent',
                  borderColor: mode === m ? 'rgba(34,197,94,0.3)' : 'transparent',
                  border: mode === m ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                  textShadow: mode === m ? '0 0 12px rgba(74,222,128,0.5)' : 'none',
                }}
              >
                {label}
                {mode === m && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #22c55e, #4ade80)' }} />
                )}
              </button>
            ))}
          </div>

          {/* ─── GUEST MODE ─── */}
          {mode === 'guest' && (
            <div className="panel-content">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  {/* Mask / disguise icon */}
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 14 C4 8 10 4 14 4 C18 4 24 8 24 14 C24 18 21 21 18 21 L17 24 L14 21 L11 24 L10 21 C7 21 4 18 4 14Z" fill="#166534" stroke="#4ade80" strokeWidth="1.2"/>
                    <ellipse cx="10" cy="13" rx="3" ry="2.5" fill="#040a04" stroke="#4ade80" strokeWidth="0.8"/>
                    <ellipse cx="18" cy="13" rx="3" ry="2.5" fill="#040a04" stroke="#4ade80" strokeWidth="0.8"/>
                    <path d="M4 14 C6 11 10 10 10.5 13" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.5"/>
                    <path d="M24 14 C22 11 18 10 17.5 13" stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.5"/>
                  </svg>
                  <h2 className="text-2xl font-black text-white tracking-tight">Join the Shadows</h2>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed pl-10">
                  Choose a moniker. No account needed.<br/>
                  <span className="text-green-500/70">Your identity is your only weapon.</span>
                </p>
              </div>

              <form onSubmit={handleGuestLogin} className="flex flex-col gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Alias</label>
                  <div className="auth-input relative">
                    <input
                      id="login-username"
                      type="text"
                      placeholder="Phantom, Cipher, Nobody…"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-5 pr-4 py-4 rounded-xl text-white placeholder-gray-700 transition-all duration-200"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        outline: 'none',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      required
                      maxLength={15}
                    />
                    {/* Left accent bar — lights up on focus via JS above */}
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-200 pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, #4ade80, #22c55e)', opacity: username ? 1 : 0 }} />
                  </div>
                  <p className="text-[10px] text-gray-600 pl-1">Max 15 characters · No spaces</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glow-white w-full mt-1 font-extrabold text-base py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-40 flex justify-center items-center gap-3 group"
                  style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)', color: '#040a04' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31" strokeDashoffset="10"/></svg>
                      Infiltrating…
                    </span>
                  ) : (
                    <>
                      Enter the Game
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* OR divider */}
                <div className="relative flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
                  <span className="text-[10px] uppercase tracking-widest text-gray-600">or</span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('register'); setUsername(''); setPassword(''); }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-green-400 border transition-all duration-200 group"
                  style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.45)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.09)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.04)'; }}
                >
                  Create a free account — save your stats
                </button>
              </form>
            </div>
          )}

          {/* ─── REGISTER MODE ─── */}
          {mode === 'register' && (
            <div className="panel-content">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">
                  Create Your Cover
                  <span className="block text-green-400 text-base font-medium mt-0.5">No email required.</span>
                </h2>
                <p className="text-gray-500 text-xs">Your deception starts with a legend. Make it count.</p>
              </div>

              {/* Perks — SVG icon rows */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {[
                  {
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" stroke="#4ade80" strokeWidth="1.5"/><path d="M2 21c0-4 3-6 7-6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/><circle cx="17" cy="7" r="4" stroke="#22c55e" strokeWidth="1.5"/><path d="M15 21c0-4 3-6 7-6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                    text: 'Add friends'
                  },
                  {
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v4H3z" rx="1" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/><path d="M3 10h7v11H3z" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/><path d="M13 10h8v5h-8z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/><path d="M13 18h8v3h-8z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
                    text: 'Track your stats'
                  },
                  {
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="5" stroke="#4ade80" strokeWidth="1.5"/><path d="M5 21c0-4 3.1-7 7-7s7 3 7 7" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/><path d="M16 3.5 C18 2 20 4 19 6" stroke="#22c55e" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>,
                    text: 'Custom avatar'
                  },
                  {
                    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" stroke="#4ade80" strokeWidth="1.4" strokeLinejoin="round"/></svg>,
                    text: 'Quests & rewards'
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                    style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    {item.icon}
                    <span className="text-xs text-gray-400">{item.text}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                      className="w-full pl-5 pr-4 py-3.5 rounded-xl text-white transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', outline: 'none' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      required maxLength={15}
                    />
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, #4ade80, #22c55e)', opacity: username ? 1 : 0, transition: 'opacity 0.2s' }} />
                  </div>
                  <p className="text-[10px] text-gray-600 pl-1">Unique · alphanumeric · max 15 chars</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-5 pr-4 py-3.5 rounded-xl text-white transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', outline: 'none' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      required minLength={8}
                    />
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, #4ade80, #22c55e)', opacity: password ? 1 : 0, transition: 'opacity 0.2s' }} />
                  </div>
                  <p className="text-[10px] text-gray-600 pl-1">Min 8 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glow-green w-full mt-1 font-extrabold text-base py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-40 flex justify-center items-center gap-2 group"
                  style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31" strokeDashoffset="10"/></svg>
                      Registering…
                    </span>
                  ) : (
                    <>
                      Create Account
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Password save notice */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mt-1"
                  style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="1.5"/><line x1="12" y1="8" x2="12" y2="12" stroke="#eab308" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="16" r="1.2" fill="#eab308"/></svg>
                  <p className="text-[10px] text-yellow-500/70 leading-relaxed">No email means no recovery. Let your browser save your password after registering.</p>
                </div>

                <p className="text-xs text-gray-500 text-center mt-1">
                  Already have a cover?{' '}
                  <button type="button" onClick={() => { setMode('login'); setUsername(''); setPassword(''); }}
                    className="text-green-400 font-bold hover:text-green-300 transition-colors">
                    Sign in here.
                  </button>
                </p>
              </form>
            </div>
          )}

          {/* ─── LOGIN MODE ─── */}
          {mode === 'login' && (
            <div className="panel-content">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  {/* Key icon */}
                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="7" stroke="#4ade80" strokeWidth="1.5" fill="none"/>
                    <circle cx="10" cy="10" r="3" fill="#22c55e" opacity="0.5"/>
                    <path d="M15 15 L23 23" stroke="#4ade80" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M20 20 L20 23 L23 23" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h2 className="text-2xl font-black text-white tracking-tight">Welcome Back</h2>
                </div>
                <p className="text-gray-500 text-sm pl-10">
                  Resume your deception.<br/>
                  <span className="text-green-500/60 text-xs">They never saw you leave.</span>
                </p>
              </div>

              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-5 pr-4 py-4 rounded-xl text-white transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', outline: 'none' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      required
                    />
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, #4ade80, #22c55e)', opacity: username ? 1 : 0, transition: 'opacity 0.2s' }} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-5 pr-4 py-4 rounded-xl text-white transition-all duration-200"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', outline: 'none' }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,197,94,0.45)'; e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      required
                    />
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full pointer-events-none"
                      style={{ background: 'linear-gradient(180deg, #4ade80, #22c55e)', opacity: password ? 1 : 0, transition: 'opacity 0.2s' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glow-white w-full mt-2 font-extrabold text-base py-4 px-4 rounded-xl transition-all duration-200 disabled:opacity-40 flex justify-center items-center gap-3 group"
                  style={{ background: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)', color: '#040a04' }}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31" strokeDashoffset="10"/></svg>
                      Authenticating…
                    </span>
                  ) : (
                    <>
                      Sign In
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                <div className="relative flex items-center gap-3 my-1">
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08))' }} />
                  <span className="text-[10px] uppercase tracking-widest text-gray-600">or</span>
                  <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.08), transparent)' }} />
                </div>

                <button
                  type="button"
                  onClick={() => { setMode('register'); setUsername(''); setPassword(''); }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-green-400 border transition-all duration-200"
                  style={{ borderColor: 'rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.45)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.09)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(34,197,94,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(34,197,94,0.04)'; }}
                >
                  Don't have an account? Register free.
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
