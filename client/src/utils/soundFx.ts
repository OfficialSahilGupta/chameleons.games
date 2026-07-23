// client/src/utils/soundFx.ts

let audioCtx: AudioContext | null = null;
let soundsEnabled = true;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
};

export const toggleSounds = (enabled: boolean) => {
  soundsEnabled = enabled;
};

const playTone = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
  if (!soundsEnabled) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
};

export const playTick = () => playTone(600, 'sine', 0.1, 0.05);
export const playDing = () => playTone(880, 'sine', 0.3, 0.1);
export const playSting = () => {
  if (!soundsEnabled) return;
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
  
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.5);
};

export const playWin = () => {
  if (!soundsEnabled) return;
  setTimeout(() => playTone(523.25, 'sine', 0.2, 0.1), 0); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.2, 0.1), 150); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.4, 0.1), 300); // G5
};
