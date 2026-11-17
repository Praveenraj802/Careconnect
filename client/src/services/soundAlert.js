// AudioContext synthesizer for real emergency alerts without missing asset dependencies
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play urgent 2-tone emergency siren
export const playEmergencyAlarm = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.2, now);

    // Siren pitch modulation
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.25);
    osc.frequency.linearRampToValueAtTime(850, now + 0.5);
    osc.frequency.linearRampToValueAtTime(600, now + 0.75);
    osc.frequency.linearRampToValueAtTime(850, now + 1.0);

    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  } catch (e) {
    console.warn('Audio alert could not play:', e);
  }
};

// Play gentle notification chime
export const playChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, now);

    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.15); // A5

    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {
    console.warn('Notification chime could not play:', e);
  }
};

// Request & trigger native browser notifications
export const triggerBrowserNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '🚨',
      badge: '🚨',
      ...options,
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, {
          icon: '🚨',
          ...options,
        });
      }
    });
  }
};
