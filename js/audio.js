// Tiny synthesized sound effects (no audio files needed).
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('kto-muted') === '1'; } catch { /* storage unavailable */ }

export function unlockAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('kto-muted', m ? '1' : '0'); } catch { /* ignore */ }
}

function tone(freq, dur, { type = 'sine', vol = 0.12, slide = 0, delay = 0 } = {}) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  hit: () => tone(320, 0.08, { type: 'square', vol: 0.06, slide: -120 }),
  catch: (combo = 1) => tone(440 + Math.min(combo, 20) * 30, 0.12, { type: 'triangle', vol: 0.12, slide: 200 }),
  miss: () => tone(140, 0.08, { type: 'sine', vol: 0.05 }),
  power: () => { tone(660, 0.1, { type: 'triangle' }); tone(990, 0.15, { type: 'triangle', delay: 0.08 }); },
  wave: () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, { type: 'triangle', delay: i * 0.1 })),
  boss: () => tone(110, 0.6, { type: 'sawtooth', vol: 0.1, slide: -40 }),
  sweep: () => tone(200, 0.5, { type: 'sawtooth', vol: 0.12, slide: 1200 }),
  leak: () => tone(220, 0.25, { type: 'sawtooth', vol: 0.08, slide: -140 }),
  shield: () => tone(300, 0.3, { type: 'square', vol: 0.1, slide: -200 }),
  over: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, { type: 'sawtooth', vol: 0.09, delay: i * 0.18 })),
};
