// Tiny synthesized sound effects (no audio files needed unless the manifest
// lists one) plus looping music tracks.
import { SOUNDS } from './data/sounds.js';
import { ASSET_FILES } from './data/asset-manifest.js';
import { CONFIG } from './config.js';

let ctx = null;
let muted = false;
try { muted = localStorage.getItem('kto-muted') === '1'; } catch { /* storage unavailable */ }

const buffers = new Map(); // sound id -> decoded AudioBuffer
const loading = new Set(); // sound ids being fetched (unlockAudio can run twice quickly)
const knownAssets = new Set(ASSET_FILES); // only these files are ever requested

/** A sound's file when it is in the manifest (.mp3 first, then .ogg), else null. */
function soundFile(entry) {
  if (!entry?.file) return null;
  if (knownAssets.has(entry.file)) return entry.file;
  if (entry.file.endsWith('.mp3')) {
    const ogg = `${entry.file.slice(0, -4)}.ogg`;
    if (knownAssets.has(ogg)) return ogg;
  }
  return null;
}

/** A music track's file when it is in the manifest (.mp3 first, then .ogg), else null. */
function musicFile(name) {
  const base = `assets/music/${name}`;
  if (knownAssets.has(`${base}.mp3`)) return `${base}.mp3`;
  if (knownAssets.has(`${base}.ogg`)) return `${base}.ogg`;
  return null;
}

export function unlockAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  void preloadSounds();
  resumeMusic();
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('kto-muted', m ? '1' : '0'); } catch { /* ignore */ }
  if (muted) pauseMusic(); else resumeMusic();
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

function noise(dur, vol = 0.1, delay = 0) {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.setValueAtTime(1200, t0);
  f.frequency.exponentialRampToValueAtTime(300, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t0);
  src.stop(t0 + dur);
}

const SYNTH = {
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
  kick: () => { noise(0.13, 0.12); tone(150, 0.16, { type: 'sine', vol: 0.2, slide: -90, delay: 0.03 }); },
  warn: () => { tone(1100, 0.06, { type: 'sine', vol: 0.05 }); tone(1100, 0.06, { type: 'sine', vol: 0.05, delay: 0.1 }); },
  tap: () => tone(700, 0.03, { type: 'sine', vol: 0.06 }),
};

/** Fetch and decode every sound file that is in the manifest. No-ops until the AudioContext exists. */
export async function preloadSounds() {
  if (!ctx) return;
  for (const [id, entry] of Object.entries(SOUNDS)) {
    const file = soundFile(entry);
    if (!file || buffers.has(id) || loading.has(id)) continue;
    loading.add(id);
    try {
      const res = await fetch(file);
      if (!res.ok) continue;
      const data = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(data);
      buffers.set(id, buf);
    } catch { /* missing/undecodable file: keep the synth fallback */ }
  }
}

/** Play the decoded file when loaded, otherwise the synth fallback. Never throws. */
export function play(id, arg) {
  if (muted || !ctx) return;
  const buffer = buffers.get(id);
  if (buffer) {
    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const g = ctx.createGain();
      g.gain.value = (SOUNDS[id]?.volume ?? 1) * CONFIG.audio.sfxVolume;
      src.connect(g).connect(ctx.destination);
      src.start();
    } catch { /* ignore playback errors */ }
    return;
  }
  const fn = SYNTH[SOUNDS[id]?.synth];
  if (fn) {
    try { fn(arg); } catch { /* ignore */ }
  }
}

export const sfx = {
  hit: () => play('hit'),
  catch: (combo = 1) => play('catch', combo),
  miss: () => play('miss'),
  combo: () => play('combo'),
  close: () => play('close'),
  power: () => play('power'),
  freeze: () => play('freeze'),
  wall: () => play('wall'),
  shield: () => play('shield'),
  sweep: () => play('sweep'),
  wave: () => play('wave'),
  cleared: () => play('cleared'),
  boss: () => play('boss'),
  leak: () => play('leak'),
  perk: () => play('perk'),
  over: () => play('over'),
  record: () => play('record'),
  tap: () => play('tap'),
  warn: () => play('warn'),
  kick: () => play('kick'),
};

// ---------------------------------------------------------------------- music
// One looping <audio> element per track, only when the file is in the manifest.
const musicEls = new Map(); // track name -> HTMLAudioElement
let currentMusic = null;

function getMusicEl(name, path) {
  let el = musicEls.get(name);
  if (!el) {
    el = new Audio(path);
    el.loop = true;
    el.preload = 'auto';
    musicEls.set(name, el);
  }
  el.volume = CONFIG.audio.musicVolume;
  return el;
}

function playMusicEl(el) {
  if (muted) return;
  try { void el.play()?.catch?.(() => {}); } catch { /* autoplay blocked until a gesture */ }
}

function pauseMusic() {
  const el = currentMusic ? musicEls.get(currentMusic) : null;
  try { el?.pause(); } catch { /* ignore */ }
}

function resumeMusic() {
  if (!currentMusic) return;
  const el = musicEls.get(currentMusic);
  if (el && el.paused) playMusicEl(el);
}

/** Start `name` ('menu' | 'game' | 'boss') when its file is in the manifest. */
export function playMusic(name) {
  const path = musicFile(name);
  if (!path) return;
  if (name === currentMusic) {
    const el = musicEls.get(name);
    if (el && el.paused) playMusicEl(el);
    return;
  }
  pauseMusic();
  currentMusic = name;
  playMusicEl(getMusicEl(name, path));
}

/** Stop the current track (game over) and forget it, so unmute won't restart it. */
export function stopMusic() {
  pauseMusic();
  currentMusic = null;
}
