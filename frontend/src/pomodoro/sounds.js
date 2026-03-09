/**
 * Lightweight Web Audio API sound helpers.
 * All sounds are synthesised – no external assets needed.
 */

let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return ctx;
}

function beep(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (_) {
    // AudioContext may be unavailable in test environments
  }
}

export function playStart() {
  beep(523, 0.15, 'sine', 0.3); // C5
  setTimeout(() => beep(659, 0.15, 'sine', 0.3), 150); // E5
  setTimeout(() => beep(784, 0.25, 'sine', 0.3), 300); // G5
}

export function playEnd() {
  beep(784, 0.2, 'sine', 0.35);
  setTimeout(() => beep(659, 0.2, 'sine', 0.35), 200);
  setTimeout(() => beep(523, 0.4, 'sine', 0.35), 400);
}

export function playTick() {
  beep(1200, 0.03, 'square', 0.05);
}

export function playLevelUp() {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => beep(freq, 0.2, 'triangle', 0.3), i * 120);
  });
}
