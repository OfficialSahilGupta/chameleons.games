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
      const res = await fetch((import.meta.env.PROD ? '' : 'http://localhost:4001') + '/api/auth/guest', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (res.ok) { setAuth(data.token, data.user); navigate('/lobby'); }
      else alert(data.message || 'Login failed');
    } catch { alert('Network error'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.PROD ? '' : 'http://localhost:4001') + '/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) { setAuth(data.token, data.user); navigate('/lobby'); }
      else alert(data.message || 'Registration failed');
    } catch { alert('Network error'); }
    finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch((import.meta.env.PROD ? '' : 'http://localhost:4001') + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) { setAuth(data.token, data.user); navigate('/lobby'); }
      else alert(data.message || 'Login failed');
    } catch { alert('Network error'); }
    finally { setLoading(false); }
  };

  const switchMode = (m: 'guest' | 'login' | 'register') => {
    setMode(m); setUsername(''); setPassword('');
  };

  const inputCls = 'w-full pl-4 pr-4 py-3.5 rounded-lg text-white text-sm transition-all duration-200 focus:outline-none';
  const inputSty = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' } as React.CSSProperties;
  const iFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)';
    e.currentTarget.style.background = 'rgba(74,222,128,0.04)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.08)';
  };
  const iBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
    e.currentTarget.style.boxShadow = 'none';
  };

  const Spinner = () => (
    <svg className="w-4 h-4 spin shrink-0" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31" strokeDashoffset="10"/>
    </svg>
  );

  const Arrow = () => (
    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3"/>
    </svg>
  );

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white flex flex-col md:flex-row relative overflow-hidden font-sans">

      <style>{`
        @keyframes camouflage {
          0%   { filter: hue-rotate(0deg)   brightness(1);   }
          25%  { filter: hue-rotate(90deg)  brightness(1.2); }
          50%  { filter: hue-rotate(180deg) brightness(0.9); }
          75%  { filter: hue-rotate(270deg) brightness(1.1); }
          100% { filter: hue-rotate(360deg) brightness(1);   }
        }
        .animate-camouflage { animation: camouflage 20s infinite linear; }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.25s ease forwards; }
        @keyframes glow-g {
          0%,100% { box-shadow: 0 0 16px rgba(34,197,94,0.25); }
          50%     { box-shadow: 0 0 30px rgba(34,197,94,0.5);  }
        }
        .btn-g { animation: glow-g 2.5s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.75s linear infinite; }

        /* ── Chameleon idle animations ── */
        @keyframes ch-sway {
          0%,100% { transform: translateX(0px) rotate(0deg); }
          30%     { transform: translateX(-5px) rotate(-1.2deg); }
          70%     { transform: translateX(5px) rotate(1.2deg); }
        }
        .ch-sway { animation: ch-sway 6s ease-in-out infinite; }

        @keyframes ch-breathe {
          0%,100% { transform: scaleY(1); }
          50%     { transform: scaleY(0.96); }
        }
        .ch-breathe { animation: ch-breathe 4s ease-in-out infinite; transform-origin: top center; }

        @keyframes eye-l {
          0%,100% { transform: translate(0px, 0px); }
          25%     { transform: translate(-3px, 2px); }
          50%     { transform: translate(1px, -2px); }
          75%     { transform: translate(3px, 1px); }
        }
        .eye-l { animation: eye-l 7s ease-in-out infinite; }

        @keyframes eye-r {
          0%,100% { transform: translate(0px, 0px); }
          25%     { transform: translate(3px, -1px); }
          50%     { transform: translate(-2px, 2px); }
          75%     { transform: translate(-3px, -2px); }
        }
        .eye-r { animation: eye-r 8.5s ease-in-out infinite; }

        @keyframes tongue-flick {
          0%,78%,100% { transform: scaleY(0); opacity: 0; }
          80%         { transform: scaleY(1); opacity: 1; }
          88%         { transform: scaleY(1); opacity: 1; }
          92%         { transform: scaleY(0); opacity: 0; }
        }
        .tongue { animation: tongue-flick 9s ease-in-out infinite; transform-origin: top center; }

        @keyframes tail-wave {
          0%,100% { d: path("M 100,0 C 90,20 70,30 60,55 C 48,82 55,105 45,125 C 32,150 15,155 20,175"); }
          50%     { d: path("M 100,0 C 110,20 130,30 140,55 C 152,82 145,105 155,125 C 168,150 185,155 180,175"); }
        }

        @keyframes tail-swing {
          0%,100% { transform: rotate(-8deg); }
          50%     { transform: rotate(8deg); }
        }
        .tail-swing { animation: tail-swing 5s ease-in-out infinite; transform-origin: top center; }

        @keyframes ch-slide-up {
          from { transform: translateY(0);   opacity: 1; }
          to   { transform: translateY(-70px); opacity: 0; }
        }
        @keyframes ch-slide-up-in {
          from { transform: translateY(-70px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes ch-slide-down {
          from { transform: translateY(0);   opacity: 1; }
          to   { transform: translateY(70px);  opacity: 0; }
        }
        @keyframes ch-slide-down-in {
          from { transform: translateY(70px);  opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .ch-hide-up   { animation: ch-slide-up   0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
        .ch-show-up   { animation: ch-slide-up-in 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
        .ch-hide-down { animation: ch-slide-down  0.6s cubic-bezier(0.4,0,0.2,1) forwards; }
        .ch-show-down { animation: ch-slide-down-in 0.6s cubic-bezier(0.4,0,0.2,1) forwards; }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        /* Hide scrollbar for IE, Edge and Firefox */
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-green-900/20 rounded-full blur-[150px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite] animate-camouflage pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[30%] w-[60vw] h-[60vw] bg-red-900/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* watermark chameleon */}
      <svg className="absolute w-[800px] h-[800px] text-green-500/5 -left-32 top-10 -z-10 rotate-[-10deg] pointer-events-none animate-camouflage" viewBox="-30 -10 140 140" fill="currentColor">
        <path d="M 30,70 A 25,25 0 1,0 80,70 A 20,20 0 1,1 40,70 A 15,15 0 1,0 70,70 A 10,10 0 1,1 50,70" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M 30,70 C 10,80 0,60 10,40 C 20,10 50,15 50,45 C 50,60 40,70 30,70 Z" />
        <path d="M 22,18 C 25,-5 45,0 45,20 Z" />
        <circle cx="20" cy="35" r="7" fill="#050505" />
        <circle cx="18" cy="35" r="2.5" fill="currentColor" className="animate-[pulse_3s_ease-in-out_infinite]" />
        <path d="M 28,70 L 22,88 L 12,88 M 42,65 L 45,88 L 55,88" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 8,43 C -15,45 -10,30 -25,40" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeDasharray="4 2" />
        <circle cx="-25" cy="40" r="3" />
      </svg>

      {/* top bar — logo only, nav removed (panel tab switcher is the only control) */}
      <div className="absolute top-0 w-full p-6 flex items-center z-20 pointer-events-none">
        <div className="ml-6 md:ml-12 flex items-center drop-shadow-[0_0_10px_rgba(52,211,153,0.4)] group cursor-pointer relative">
          <svg viewBox="0 0 100 100" className="w-9 h-9 -mr-[2px] -mt-1 z-20 text-green-400 animate-camouflage group-hover:-translate-y-1 transition-transform duration-300" fill="currentColor" style={{ filter: 'brightness(1.1)' }}>
            <path d="M 85,25 C 50,5 15,10 10,50 C 5,85 40,95 70,85 C 85,80 90,65 75,60 C 60,55 50,65 55,75 C 60,80 70,80 70,75" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 75,10 C 95,0 100,25 85,35 Z" fill="currentColor" />
            <circle cx="88" cy="18" r="4" fill="#050505" />
            <circle cx="89" cy="18" r="1.5" fill="currentColor" className="animate-[pulse_2s_ease-in-out_infinite]" />
            <path d="M 35,20 L 25,35 M 60,12 L 65,30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <div className="absolute left-[30px] top-[10px] w-[185px] h-[3px] bg-green-400 rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-[400ms] ease-out z-10 animate-camouflage" />
          <div className="absolute left-[215px] top-[8.5px] w-[8px] h-[6px] bg-green-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[300ms] z-10 animate-camouflage" />
          <div className="font-black text-2xl tracking-[0.2em] text-transparent bg-clip-text animate-camouflage z-30"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'12\' viewBox=\'0 0 12 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M6 0a6 6 0 0 0-6 6 6 6 0 0 0 6 6 6 6 0 0 0 6-6 6 6 0 0 0-6-6zm0 1.5a4.5 4.5 0 0 1 4.5 4.5 4.5 4.5 0 0 1-4.5 4.5 4.5 4.5 0 0 1-4.5-4.5 4.5 4.5 0 0 1 4.5-4.5z\' fill=\'%23ffffff\' fill-opacity=\'0.15\' fill-rule=\'evenodd\'/%3E%3C/svg%3E"), linear-gradient(to right, #4ade80, #60a5fa, #a855f7)' }}>
            HAMELEONS
          </div>
          <svg className="absolute -right-6 top-1.5 w-4 h-4 text-gray-400 animate-pulse group-hover:opacity-0 transition-opacity duration-75 delay-[350ms]" viewBox="0 0 24 24">
            <path d="M12 10c-3-4-7-6-9-4 1 3 5 5 9 4z" fill="white" opacity="0.6"/>
            <path d="M12 10c3-4 7-6 9-4-1 3-5 5-9 4z" fill="white" opacity="0.6"/>
            <ellipse cx="12" cy="14" rx="2" ry="4" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* ═══════════════════════════ LEFT HERO ═══════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 pt-20 md:pt-0 z-10 min-h-0">
        <div className="max-w-2xl">
          <div className="inline-block px-4 py-2 mb-6 border border-green-500/30 bg-green-500/10 text-green-400 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            A Psychological Game of Deception
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05] tracking-tighter">
            TRUST <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-gray-500 via-gray-300 to-white">NO ONE.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-xl font-light">
            A secret word is shared among everyone—except the <strong className="text-green-500 font-bold">Chameleon</strong>.{' '}
            Blend in, manipulate the truth, or hunt down the liar before they steal the game. Are you a villager, or are you hiding in plain sight?
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => { switchMode('guest'); setTimeout(() => document.getElementById('main-username')?.focus(), 50); }}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-[0_0_30px_rgba(22,163,74,0.3)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              Play Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            <button
              onClick={() => alert("HOW TO PLAY:\n\n1. Everyone gets a secret word except the Chameleon.\n2. Each player says one related word to prove they know the secret.\n3. The Chameleon must deduce the word and blend in.\n4. Vote out the Chameleon — or the Chameleon wins by guessing the word!")}
              className="px-8 py-4 bg-transparent border border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 text-gray-300 hover:text-white font-bold rounded-xl transition-all"
            >
              How to Play
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ RIGHT COLUMN ═══════════════════════════ */}
      {/*
        3-part flex-col layout:
          [1] Top section (flex-1) — chameleon head peers DOWN at the card
          [2] Card (shrink-0)      — the frosted glass auth panel
          [3] Bottom section (flex-1) — chameleon tail coils UP from below
        When Register mode → card is tallest → top/bottom sections shrink naturally.
        Chameleon reacts: head slides up, tail slides down.
      */}
        {/* ═══ TOP CHAMELEON — peeks down at the card ═══ */}
      <div className="w-full md:w-[440px] lg:w-[480px] h-[100dvh] flex flex-col z-10 px-4 md:px-8">
        <div className="flex-1 flex items-end justify-center overflow-hidden min-h-0 pb-3 pointer-events-none shrink">
          <div
            className={mode === 'register' ? 'ch-hide-up' : 'ch-show-up'}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* ch-sway wraps the whole body for gentle swaying */}
            <div className="ch-sway">
              <svg
                width="180" height="210"
                viewBox="0 0 200 220"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* ── Neck / body coming FROM above, tapering to the head at bottom ── */}
                <g className="ch-breathe">
                  {/* Neck */}
                  <path
                    d="M 82,0 C 76,30 72,60 68,85 C 64,108 60,118 60,135 C 60,160 75,175 100,175 C 125,175 140,160 140,135 C 140,118 136,108 132,85 C 128,60 124,30 118,0"
                    fill="#166534" opacity="0.85"
                  />
                  {/* Spine ridge — dorsal crest bumps */}
                  {[8,30,52,74,96].map((y,i) => (
                    <ellipse key={i} cx="100" cy={y} rx="5" ry="4" fill="#15803d" opacity="0.7"/>
                  ))}
                  {/* Scale pattern hint */}
                  <path d="M 78,40 C 88,35 112,35 122,40" stroke="#22c55e" strokeWidth="1" opacity="0.3" fill="none"/>
                  <path d="M 74,65 C 86,59 114,59 126,65" stroke="#22c55e" strokeWidth="1" opacity="0.3" fill="none"/>
                  <path d="M 72,90 C 85,84 115,84 128,90" stroke="#22c55e" strokeWidth="1" opacity="0.3" fill="none"/>
                </g>

                {/* ── HEAD ── */}
                {/* Snout / jaw */}
                <path d="M 72,138 C 65,145 65,165 80,172 Q 100,180 120,172 C 135,165 135,145 128,138 L 115,130 L 85,130 Z" fill="#15803d"/>
                {/* Upper lip */}
                <path d="M 78,140 Q 100,148 122,140" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.6"/>
                {/* Nostril */}
                <ellipse cx="88" cy="152" rx="2.5" ry="2" fill="#052e16" opacity="0.7"/>
                <ellipse cx="112" cy="152" rx="2.5" ry="2" fill="#052e16" opacity="0.7"/>

                {/* ── LEFT EYE TURRET ── */}
                <g className="eye-l">
                  {/* Orbital bump */}
                  <ellipse cx="74" cy="128" rx="17" ry="19" fill="#14532d"/>
                  {/* Outer ring */}
                  <ellipse cx="74" cy="128" rx="13" ry="15" fill="#166534"/>
                  {/* Iris */}
                  <ellipse cx="74" cy="128" rx="9" ry="11" fill="#15803d"/>
                  {/* Scale rings on eyeball */}
                  <ellipse cx="74" cy="128" rx="9" ry="11" fill="none" stroke="#22c55e" strokeWidth="0.8" opacity="0.5"/>
                  <ellipse cx="74" cy="128" rx="5.5" ry="7" fill="none" stroke="#4ade80" strokeWidth="0.6" opacity="0.4"/>
                  {/* Pupil — vertical slit */}
                  <ellipse cx="74" cy="128" rx="3" ry="9" fill="#020a02"/>
                  {/* Catchlight */}
                  <ellipse cx="77" cy="123" rx="2.5" ry="3.5" fill="white" opacity="0.35"/>
                  {/* Eyelid ring */}
                  <ellipse cx="74" cy="128" rx="17" ry="19" fill="none" stroke="#16a34a" strokeWidth="1.2" opacity="0.5"/>
                </g>

                {/* ── RIGHT EYE TURRET ── */}
                <g className="eye-r">
                  <ellipse cx="126" cy="128" rx="17" ry="19" fill="#14532d"/>
                  <ellipse cx="126" cy="128" rx="13" ry="15" fill="#166534"/>
                  <ellipse cx="126" cy="128" rx="9" ry="11" fill="#15803d"/>
                  <ellipse cx="126" cy="128" rx="9" ry="11" fill="none" stroke="#22c55e" strokeWidth="0.8" opacity="0.5"/>
                  <ellipse cx="126" cy="128" rx="5.5" ry="7" fill="none" stroke="#4ade80" strokeWidth="0.6" opacity="0.4"/>
                  <ellipse cx="126" cy="128" rx="3" ry="9" fill="#020a02"/>
                  <ellipse cx="123" cy="123" rx="2.5" ry="3.5" fill="white" opacity="0.35"/>
                  <ellipse cx="126" cy="128" rx="17" ry="19" fill="none" stroke="#16a34a" strokeWidth="1.2" opacity="0.5"/>
                </g>

                {/* ── TONGUE — shoots down toward the card ── */}
                <g className="tongue">
                  {/* Tongue stem */}
                  <line x1="100" y1="172" x2="100" y2="210" stroke="#dc2626" strokeWidth="4" strokeLinecap="round"/>
                  {/* Sticky tip */}
                  <ellipse cx="100" cy="212" rx="6" ry="5" fill="#ef4444"/>
                  <ellipse cx="100" cy="212" rx="3" ry="2.5" fill="#fca5a5" opacity="0.6"/>
                </g>

                {/* ── Green ambient glow below head ── */}
                <ellipse cx="100" cy="185" rx="40" ry="12" fill="#22c55e" opacity="0.06"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ═══ AUTH CARD ═══ */}
        <div className="w-full relative rounded-2xl overflow-y-auto overflow-x-hidden min-h-0 shrink-0 max-h-[85vh] no-scrollbar"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 80px rgba(0,0,0,0.7), -2px 0 24px rgba(34,197,94,0.06)',
          }}>

          {/* Top accent line */}
          <div className="h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.55) 35%,rgba(74,222,128,0.9) 55%,rgba(34,197,94,0.55) 70%,transparent)' }} />

          {/* Chameleon skin scale texture */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.02 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="sc" x="0" y="0" width="22" height="13" patternUnits="userSpaceOnUse">
                  <path d="M11 0 C5.5 0 0 5 0 11 Q11 19 22 11 C22 5 16.5 0 11 0Z" fill="none" stroke="#4ade80" strokeWidth="0.6"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#sc)" />
            </svg>
          </div>

          {/* Slit-pupil chameleon eye — bottom-right corner, barely visible */}
          <div className="absolute bottom-4 right-4 pointer-events-none" style={{ opacity: 0.055 }}>
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
              <circle cx="29" cy="29" r="27" stroke="#4ade80" strokeWidth="0.8" strokeDasharray="5 4"/>
              <circle cx="29" cy="29" r="18" fill="#14532d"/>
              <circle cx="29" cy="29" r="14" stroke="#22c55e" strokeWidth="0.6" fill="none"/>
              <ellipse cx="29" cy="29" rx="4" ry="13" fill="#020a02"/>
              <ellipse cx="32" cy="24" rx="2" ry="3" fill="white" opacity="0.28"/>
            </svg>
          </div>

          <div className="relative z-10 p-7">

            {/* ── Tab switcher — single source of mode control ── */}
            <div className="flex rounded-xl mb-7 p-1 gap-0.5" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {(['guest', 'login', 'register'] as const).map((m) => {
                const label = { guest: 'Guest', login: 'Sign In', register: 'Register' }[m];
                const active = mode === m;
                return (
                  <button key={m} onClick={() => switchMode(m)}
                    className="flex-1 py-2.5 text-[11px] font-bold tracking-widest uppercase rounded-lg transition-all duration-200 relative"
                    style={{
                      color: active ? '#fff' : 'rgba(107,114,128,0.9)',
                      background: active ? 'rgba(34,197,94,0.18)' : 'transparent',
                      border: active ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                      textShadow: active ? '0 0 10px rgba(74,222,128,0.4)' : 'none',
                    }}>
                    {label}
                    {active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg,#16a34a,#4ade80)' }} />}
                  </button>
                );
              })}
            </div>

            {/* ── GUEST ── */}
            {mode === 'guest' && (
              <div className="fade-up flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">Pick your alias</h2>
                  <p className="text-gray-500 text-sm mt-0.5">No account needed. Jump straight in.</p>
                </div>
                <form onSubmit={handleGuestLogin} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.18em]">Alias</label>
                    <input id="main-username" type="text" placeholder="Phantom, Cipher, Nobody…"
                      value={username} onChange={e => setUsername(e.target.value)}
                      className={inputCls} style={inputSty} onFocus={iFocus} onBlur={iBlur}
                      required maxLength={15}/>
                    <p className="text-[10px] text-gray-600">Max 15 chars · no spaces</p>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-g w-full py-3.5 rounded-lg font-extrabold text-sm flex items-center justify-center gap-2 group disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}>
                    {loading ? <><Spinner /> Entering…</> : <>Enter the Game <Arrow /></>}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }}/>
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest">or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }}/>
                  </div>
                  <button type="button" onClick={() => switchMode('register')}
                    className="w-full py-3 rounded-lg text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)' }}>
                    Create a free account →
                  </button>
                </form>
              </div>
            )}

            {/* ── LOGIN ── */}
            {mode === 'login' && (
              <div className="fade-up flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  {/* key SVG */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                    <circle cx="9" cy="9" r="6" stroke="#4ade80" strokeWidth="1.6" fill="none"/>
                    <circle cx="9" cy="9" r="2.5" fill="#22c55e" opacity="0.5"/>
                    <path d="M13.5 13.5 L21 21" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M18 18 L18 21 L21 21" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-tight">Welcome back</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Resume your deception. <span className="text-green-700/80 text-xs">They never saw you leave.</span></p>
                  </div>
                </div>
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.18em]">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                      className={inputCls} style={inputSty} onFocus={iFocus} onBlur={iBlur} required/>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.18em]">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      className={inputCls} style={inputSty} onFocus={iFocus} onBlur={iBlur} required/>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-lg font-extrabold text-sm flex items-center justify-center gap-2 group disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#fff,#e5e7eb)', color: '#050505', boxShadow: '0 0 20px rgba(255,255,255,0.07)' }}>
                    {loading ? <><Spinner /> Authenticating…</> : <>Sign In <Arrow /></>}
                  </button>
                  <p className="text-xs text-center text-gray-500">
                    No account?{' '}
                    <button type="button" onClick={() => switchMode('register')} className="text-green-400 font-bold hover:text-green-300 transition-colors">Register free.</button>
                  </p>
                </form>
              </div>
            )}

            {/* ── REGISTER ── */}
            {mode === 'register' && (
              <div className="fade-up flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Create your cover
                    <span className="text-green-400 font-medium text-sm ml-2">— no email</span>
                  </h2>
                  <p className="text-gray-500 text-sm mt-0.5">Your legend starts here. Make it count.</p>
                </div>

                {/* perk grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Friends list', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="3.5" stroke="#4ade80" strokeWidth="1.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/><circle cx="17" cy="7" r="3.5" stroke="#22c55e" strokeWidth="1.5"/><path d="M14.5 20c0-3.5 3-5.5 7-5.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/></svg> },
                    { label: 'Stat tracking', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="4" rx="1" stroke="#4ade80" strokeWidth="1.5"/><rect x="3" y="10" width="7" height="11" rx="1" stroke="#4ade80" strokeWidth="1.5"/><rect x="13" y="10" width="8" height="5" rx="1" stroke="#22c55e" strokeWidth="1.5"/><rect x="13" y="18" width="8" height="3" rx="1" stroke="#22c55e" strokeWidth="1.5"/></svg> },
                    { label: 'Custom avatar', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4.5" stroke="#4ade80" strokeWidth="1.5"/><path d="M5 21c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/><path d="M17 4.5C18.5 3 21 4.5 20 7" stroke="#22c55e" strokeWidth="1.3" fill="none" strokeLinecap="round"/></svg> },
                    { label: 'Quests & XP', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.9 6.5H22l-5.8 4.2 2.2 6.8L12 15.5l-6.4 4 2.2-6.8L2 8.5h7.1z" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/></svg> },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.1)' }}>
                      {p.svg}
                      <span className="text-xs text-gray-400">{p.label}</span>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.18em]">Username</label>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                      className={inputCls} style={inputSty} onFocus={iFocus} onBlur={iBlur} required maxLength={15}/>
                    <p className="text-[10px] text-gray-600">Unique · alphanumeric · max 15 chars</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.18em]">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                      className={inputCls} style={inputSty} onFocus={iFocus} onBlur={iBlur} required minLength={8}/>
                    <p className="text-[10px] text-gray-600">Min 8 characters</p>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-g w-full py-3.5 rounded-lg font-extrabold text-sm flex items-center justify-center gap-2 group disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff' }}>
                    {loading ? <><Spinner /> Creating…</> : <>Create Account <Arrow /></>}
                  </button>
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.12)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0">
                      <circle cx="12" cy="12" r="10" stroke="#ca8a04" strokeWidth="1.5"/>
                      <line x1="12" y1="8" x2="12" y2="13" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16.5" r="1.2" fill="#ca8a04"/>
                    </svg>
                    <p className="text-[10px] text-yellow-600/80 leading-relaxed">No email = no recovery. Let your browser remember your password.</p>
                  </div>
                  <p className="text-xs text-center text-gray-500">
                    Already have a cover?{' '}
                    <button type="button" onClick={() => switchMode('login')} className="text-green-400 font-bold hover:text-green-300 transition-colors">Sign in.</button>
                  </p>
                </form>
              </div>
            )}

          </div>
        </div>{/* /card */}

        {/* ═══ BOTTOM CHAMELEON — tail coils up from below ═══ */}
        <div className="flex-1 flex items-start justify-center overflow-hidden min-h-0 pt-3 pointer-events-none shrink">
          <div
            className={mode === 'register' ? 'ch-hide-down' : 'ch-show-down'}
            style={{ willChange: 'transform, opacity' }}
          >
            <svg
              width="180" height="190"
              viewBox="0 0 200 195"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* ── Feet gripping the invisible bottom edge of the card ── */}
              {/* Left foot — zygodactyl (2+2 toe groups) */}
              <g fill="#166534" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round">
                <line x1="55" y1="8" x2="38" y2="22"/>
                <line x1="55" y1="8" x2="42" y2="28"/>
                <line x1="55" y1="8" x2="68" y2="22"/>
                <line x1="55" y1="8" x2="64" y2="28"/>
                <circle cx="55" cy="8" r="5" fill="#15803d"/>
              </g>
              {/* Right foot */}
              <g fill="#166534" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round">
                <line x1="145" y1="8" x2="128" y2="22"/>
                <line x1="145" y1="8" x2="132" y2="28"/>
                <line x1="145" y1="8" x2="158" y2="22"/>
                <line x1="145" y1="8" x2="154" y2="28"/>
                <circle cx="145" cy="8" r="5" fill="#15803d"/>
              </g>
              {/* Lower legs */}
              <line x1="55" y1="8" x2="70" y2="0" stroke="#15803d" strokeWidth="7" strokeLinecap="round"/>
              <line x1="145" y1="8" x2="130" y2="0" stroke="#15803d" strokeWidth="7" strokeLinecap="round"/>

              {/* ── Body stub (just below card) ── */}
              <path d="M 72,0 C 72,12 75,18 80,22 C 85,25 90,27 100,27 C 110,27 115,25 120,22 C 125,18 128,12 128,0" fill="#166534" opacity="0.8"/>

              {/* ── TAIL — coiled downward, slow swing ── */}
              <g className="tail-swing">
                {/* Main tail arc — first curl */}
                <path
                  d="M 100,28 C 95,50 70,65 55,90 C 38,118 45,145 65,158 C 82,170 105,165 115,150 C 128,132 120,112 105,105 C 92,99 80,108 85,120 C 89,130 100,132 105,125"
                  stroke="#15803d" strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round"
                />
                {/* Tail highlight spine */}
                <path
                  d="M 100,28 C 95,50 70,65 55,90 C 38,118 45,145 65,158 C 82,170 105,165 115,150 C 128,132 120,112 105,105 C 92,99 80,108 85,120 C 89,130 100,132 105,125"
                  stroke="#22c55e" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"
                />
                {/* Scale rings along tail */}
                {[0.15, 0.3, 0.45, 0.6, 0.75].map((t, i) => {
                  // approximate points along the tail path
                  const pts = [
                    [94,40],[76,62],[57,88],[52,115],[68,147],[98,163],[113,145],[110,118],[93,108],[86,122]
                  ];
                  const idx = Math.floor(t * pts.length);
                  const [x, y] = pts[Math.min(idx, pts.length-1)];
                  return <ellipse key={i} cx={x} cy={y} rx={5 - i*0.5} ry={3 - i*0.3} fill="#22c55e" opacity={0.2}/>
                })}
              </g>

              {/* Ambient glow */}
              <ellipse cx="100" cy="10" rx="50" ry="8" fill="#22c55e" opacity="0.05"/>
            </svg>
          </div>
        </div>

      </div>{/* /right column */}

    </div>
  );
}
