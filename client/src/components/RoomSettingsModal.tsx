import { useState, useEffect } from 'react';

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  initialSettings?: any;
  isCreateMode?: boolean;
}

export default function RoomSettingsModal({ isOpen, onClose, onSave, initialSettings, isCreateMode = false }: RoomSettingsModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [roundCount, setRoundCount] = useState(3);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [turnMode, setTurnMode] = useState('simultaneous');
  const [enabledCategories, setEnabledCategories] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [allowSpectators, setAllowSpectators] = useState(false);

  useEffect(() => {
    fetch((import.meta.env.PROD ? "" : "http://localhost:4001") + '/api/categories')
      .then(res => res.json())
      .then(data => {
        const sortedData = data.sort((a: any, b: any) => {
          if (a.name === 'Marvel') return 1;
          if (b.name === 'Marvel') return -1;
          return 0;
        });
        setCategories(sortedData);
        if (isCreateMode && sortedData.length > 0 && enabledCategories.length === 0) {
          // Pre-select first category by default
          setEnabledCategories([sortedData[0].name]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.name) setName(initialSettings.name);
      if (initialSettings.settings) {
        setMaxPlayers(initialSettings.settings.maxPlayers || 8);
        setRoundCount(initialSettings.settings.roundCount || 3);
        setTimerSeconds(initialSettings.settings.timerSeconds || 30);
        setTurnMode(initialSettings.settings.turnMode || 'simultaneous');
        setEnabledCategories(initialSettings.settings.enabledCategories || []);
        setIsPrivate(initialSettings.settings.isPrivate || false);
        setPassword(initialSettings.settings.password || '');
        setAllowSpectators(initialSettings.settings.allowSpectators || false);
      }
    }
  }, [initialSettings, isOpen]);

  if (!isOpen) return null;

  const handleToggleCategory = (catName: string) => {
    setEnabledCategories([catName]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (enabledCategories.length === 0) {
      alert("Please select at least one category.");
      return;
    }
    
    onSave({
      name,
      maxPlayers,
      roundCount,
      timerSeconds,
      turnMode,
      enabledCategories,
      isPrivate,
      password,
      allowSpectators
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-black/40 border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/80 to-transparent" />

        <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0 relative">
          <h2 className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 uppercase flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isCreateMode ? 'CREATE ROOM' : 'ROOM SETTINGS'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white hover:bg-white/5 p-2 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="room-settings-form" onSubmit={handleSave} className="flex flex-col gap-8">

            
            {/* Room Name */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">Room Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  maxLength={30}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-green-500 focus:bg-black/40 text-white font-mono text-lg transition-all peer"
                  placeholder="e.g. ALPHA SITE"
                />
                <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_15px_rgba(34,197,94,0.1)] transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Players */}
              <div>
                <label className="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">Capacity (2-20)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="2" max="20" 
                    value={maxPlayers}
                    onChange={e => setMaxPlayers(parseInt(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-green-500 focus:bg-black/40 text-white font-mono text-lg transition-all peer"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_15px_rgba(34,197,94,0.1)] transition-all" />
                </div>
              </div>

              {/* Rounds */}
              <div>
                <label className="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">Number of Rounds</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1" max="10" 
                    value={roundCount}
                    onChange={e => setRoundCount(parseInt(e.target.value))}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-green-500 focus:bg-black/40 text-white font-mono text-lg transition-all peer"
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_15px_rgba(34,197,94,0.1)] transition-all" />
                </div>
              </div>

              {/* Timer */}
              <div>
                <label className="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">Turn Timer</label>
                <div className="relative group">
                  <select 
                    value={timerSeconds}
                    onChange={e => setTimerSeconds(parseInt(e.target.value))}
                    className="appearance-none w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-green-500 focus:bg-black/40 text-white font-mono text-lg transition-all cursor-pointer peer"
                  >
                    <option value="15" className="bg-gray-900">15s (Blitz)</option>
                    <option value="30" className="bg-gray-900">30s (Standard)</option>
                    <option value="45" className="bg-gray-900">45s (Tactical)</option>
                    <option value="60" className="bg-gray-900">60s (Deliberate)</option>
                  </select>
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_15px_rgba(34,197,94,0.1)] transition-all" />
                  <svg className="absolute right-4 top-5 w-5 h-5 text-gray-500 pointer-events-none group-hover:text-green-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Turn Mode */}
              <div>
                <label className="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">Turn Mode</label>
                <div className="relative group">
                  <select 
                    value={turnMode}
                    onChange={e => setTurnMode(e.target.value)}
                    className="appearance-none w-full bg-black/20 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-green-500 focus:bg-black/40 text-white font-mono text-lg transition-all cursor-pointer peer"
                  >
                    <option value="simultaneous" className="bg-gray-900">Simultaneous</option>
                    <option value="sequential" className="bg-gray-900">Sequential</option>
                  </select>
                  <div className="absolute inset-0 rounded-xl pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_15px_rgba(34,197,94,0.1)] transition-all" />
                  <svg className="absolute right-4 top-5 w-5 h-5 text-gray-500 pointer-events-none group-hover:text-green-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Privacy Checkboxes */}
            <div className="flex flex-col sm:flex-row gap-6 bg-white/[0.02] p-5 rounded-xl border border-white/5">
              <div className="flex flex-col gap-4 flex-1">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${isPrivate ? 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-black/50 border border-white/10 group-hover:border-green-500/50'}`}>
                    {isPrivate && <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span className="text-white font-bold tracking-wider group-hover:text-green-100 transition-colors">Private Room</span>
                </label>
                {isPrivate && (
                  <div className="relative mt-2 ml-10">
                    <input 
                      type="text" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="SET PASSWORD..."
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-green-500 text-white font-mono text-sm tracking-widest uppercase transition-all peer"
                    />
                    <div className="absolute inset-0 rounded-lg pointer-events-none border border-green-500/0 peer-focus:border-green-500/50 peer-focus:shadow-[inset_0_0_10px_rgba(34,197,94,0.1)] transition-all" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={allowSpectators}
                    onChange={e => setAllowSpectators(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded flex items-center justify-center transition-all ${allowSpectators ? 'bg-green-500 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-black/50 border border-white/10 group-hover:border-green-500/50'}`}>
                    {allowSpectators && <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </div>
                  <span className="text-white font-bold tracking-wider group-hover:text-green-100 transition-colors">Allow Spectators</span>
                </label>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="block text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-3">Categories</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.length === 0 && <div className="text-gray-500 italic text-sm">Loading categories...</div>}
                {categories.map(cat => {
                  const isSelected = enabledCategories.includes(cat.name);
                  return (
                    <label key={cat._id} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-300 ${isSelected ? 'bg-green-500/10 border-green-500/80 shadow-[inset_0_0_20px_rgba(34,197,94,0.1),0_0_15px_rgba(34,197,94,0.2)]' : 'bg-black/30 border-white/5 hover:border-white/20 hover:bg-white/5'}`} style={{ borderStyle: 'solid', borderWidth: '1px' }}>
                      <input 
                        type="radio"
                        name="categorySelect"
                        checked={isSelected}
                        onChange={() => handleToggleCategory(cat.name)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full flex flex-shrink-0 items-center justify-center transition-all ${isSelected ? 'border border-green-400' : 'border border-gray-600'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,1)]" />}
                      </div>
                      <span className={`font-bold tracking-wider truncate ${isSelected ? 'text-green-300' : 'text-gray-300'}`}>{cat.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4 shrink-0">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold tracking-widest uppercase text-xs border border-white/10 hover:border-white/30 hover:bg-white/5 text-gray-300 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="room-settings-form"
            className="px-8 py-3 rounded-xl font-bold tracking-widest uppercase text-xs bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(74,222,128,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isCreateMode ? 'CREATE ROOM' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>
    </div>
  );
}
