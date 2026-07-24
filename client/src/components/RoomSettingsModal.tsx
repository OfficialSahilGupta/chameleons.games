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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl my-8 relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center shrink-0">
          <h2 className="text-2xl font-bold text-green-400">
            {isCreateMode ? 'Create Room' : 'Room Settings'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="room-settings-form" onSubmit={handleSave} className="flex flex-col gap-6">
            
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <label className="block text-gray-300 font-bold mb-2">Room Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={30}
                className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:outline-none focus:border-green-500 text-white"
                placeholder="e.g. Sahil's Epic Game"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 font-bold mb-2">Max Players (2-20)</label>
                <input 
                  type="number" 
                  min="2" max="20" 
                  value={maxPlayers}
                  onChange={e => setMaxPlayers(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:outline-none focus:border-green-500 text-white"
                />
              </div>

              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 font-bold mb-2">Number of Rounds</label>
                <input 
                  type="number" 
                  min="1" max="10" 
                  value={roundCount}
                  onChange={e => setRoundCount(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:outline-none focus:border-green-500 text-white"
                />
              </div>

              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 font-bold mb-2">Turn Timer</label>
                <select 
                  value={timerSeconds}
                  onChange={e => setTimerSeconds(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:outline-none focus:border-green-500 text-white"
                >
                  <option value="15">15 Seconds (Lightning)</option>
                  <option value="30">30 Seconds (Normal)</option>
                  <option value="45">45 Seconds (Relaxed)</option>
                  <option value="60">60 Seconds (Slow)</option>
                </select>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <label className="block text-gray-300 font-bold mb-2">Turn Mode</label>
                <select 
                  value={turnMode}
                  onChange={e => setTurnMode(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:outline-none focus:border-green-500 text-white"
                >
                  <option value="simultaneous">Simultaneous (Fast-paced)</option>
                  <option value="sequential">Sequential (One at a time)</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <label className="block text-gray-300 font-bold mb-2">Privacy & Access</label>
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isPrivate}
                    onChange={e => setIsPrivate(e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-white font-medium">Private Room</span>
                </label>
                {isPrivate && (
                  <input 
                    type="text" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Optional Room Password"
                    className="w-full bg-gray-800 border border-gray-600 rounded p-3 focus:outline-none focus:border-green-500 text-white"
                  />
                )}
                
                <label className="flex items-center gap-3 cursor-pointer mt-2">
                  <input 
                    type="checkbox"
                    checked={allowSpectators}
                    onChange={e => setAllowSpectators(e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-gray-900"
                  />
                  <span className="text-white font-medium">Allow Spectators</span>
                </label>
              </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
              <div className="flex justify-between items-end mb-3">
                <label className="block text-gray-300 font-bold">Categories</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {categories.length === 0 && <div className="text-gray-500 italic">Loading categories...</div>}
                {categories.map(cat => (
                  <label key={cat._id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-600 cursor-pointer hover:border-gray-500 transition">
                    <input 
                      type="radio"
                      name="categorySelect"
                      checked={enabledCategories.includes(cat.name)}
                      onChange={() => handleToggleCategory(cat.name)}
                      className="w-5 h-5 rounded bg-gray-900 border-gray-500 text-green-500 focus:ring-green-500 focus:ring-offset-gray-800"
                    />
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{cat.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-700 bg-gray-800/80 rounded-b-2xl shrink-0 flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 rounded-lg font-bold bg-gray-700 hover:bg-gray-600 text-white transition"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="room-settings-form"
            className="px-8 py-3 rounded-lg font-bold bg-green-600 hover:bg-green-500 text-white shadow-lg transition"
          >
            {isCreateMode ? 'Create Room' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
