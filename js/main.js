import { Game } from './game.js';
import { CHARACTERS, POWERUPS } from './characters.js';
import { unlockAudio, isMuted, setMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const screens = ['menu', 'howto', 'pause', 'over'];
function show(id) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== id);
  const playing = id === null;
  $('hud').classList.toggle('hidden', !playing && id !== 'pause');
  $('sweepBtn').classList.toggle('hidden', !playing);
}

// ----- HUD
const hud = { score: $('score'), wave: $('wave'), combo: $('combo'), shield: $('shield'), sweepFill: $('sweepFill'), sweepBtn: $('sweepBtn') };
const lastHud = {};
function setText(el, key, v) { if (lastHud[key] !== v) { lastHud[key] = v; el.textContent = v; } }
function onHud(g) {
  setText(hud.score, 'score', g.score.toLocaleString());
  setText(hud.wave, 'wave', String(g.wave));
  const m = g.combo > 1 ? `${g.combo} combo · x${g.multiplier()}` : '';
  setText(hud.combo, 'combo', m);
  setText(hud.shield, 'shield', '🛡️'.repeat(g.shield));
  const pct = `${g.sweep}%`;
  if (lastHud.sweep !== pct) { lastHud.sweep = pct; hud.sweepFill.style.width = pct; }
  hud.sweepBtn.classList.toggle('ready', g.sweep >= 100);
}

let bannerTimer;
function onBanner(title, sub) {
  $('bannerTitle').textContent = title;
  $('bannerSub').textContent = sub || '';
  const b = $('banner');
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('show'), 1800);
}

function onGameOver(s) {
  const best = store.get('kto-best', { score: 0, wave: 0 });
  const isRecord = s.score > best.score;
  if (isRecord) store.set('kto-best', { score: s.score, wave: s.wave });
  $('overScore').textContent = s.score.toLocaleString();
  $('overRecord').classList.toggle('hidden', !isRecord);
  $('overReason').textContent = `A ${s.intruder.toLowerCase()} slipped across the border on wave ${s.wave}.`;
  $('overStats').innerHTML = [
    ['Wave reached', s.wave], ['Intruders caught', s.caught], ['Best combo', s.bestCombo],
    ['Accuracy', `${s.accuracy}%`], ['Close calls', s.closeCalls], ['Bosses stopped', s.bosses],
    ['Best score', Math.max(best.score, s.score).toLocaleString()],
  ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');
  lastResult = s;
  show('over');
  updateBest();
}

const game = new Game($('game'), { onHud, onBanner, onGameOver });
window.__game = game; // handy for debugging from the console
let lastResult = null;

function updateBest() {
  const best = store.get('kto-best', { score: 0, wave: 0 });
  $('bestLine').textContent = best.score ? `Best: ${best.score.toLocaleString()} · wave ${best.wave}` : 'No record yet — be the first guard!';
}

function play() {
  unlockAudio();
  show(null);
  game.start();
}

// ----- buttons
$('playBtn').onclick = play;
$('againBtn').onclick = play;
$('howBtn').onclick = () => show('howto');
$('howBack').onclick = () => show('menu');
$('menuBtn').onclick = () => { game.mode = 'menu'; game.reset(); show('menu'); };
$('quitBtn').onclick = () => { game.mode = 'menu'; game.reset(); show('menu'); };
$('pauseBtn').onclick = () => { game.pause(); show('pause'); };
$('resumeBtn').onclick = () => { game.resume(); show(null); };
$('sweepBtn').onclick = () => game.useSweep();

const muteBtn = $('muteBtn');
const syncMute = () => { muteBtn.textContent = isMuted() ? '🔇' : '🔊'; };
muteBtn.onclick = () => { setMuted(!isMuted()); unlockAudio(); syncMute(); };
syncMute();

$('shareBtn').onclick = async () => {
  const s = lastResult;
  const text = `I kept them out of Bangladesh until wave ${s?.wave ?? 1} and scored ${(s?.score ?? 0).toLocaleString()} points in Keep Them Out! Can you beat me?`;
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ title: 'Keep Them Out!', text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); onBanner('Copied!', 'Share text copied to clipboard'); }
  } catch { /* user cancelled */ }
};

// keyboard (desktop)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); game.useSweep(); }
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (game.mode === 'playing') { game.pause(); show('pause'); } else if (game.mode === 'paused') { game.resume(); show(null); }
  }
  if (e.code === 'Enter' && (!$('menu').classList.contains('hidden') || !$('over').classList.contains('hidden'))) play();
});

// auto-pause when app goes to background
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.mode === 'playing') { game.pause(); show('pause'); }
});

// ----- how-to roster table
$('roster').innerHTML = Object.values(CHARACTERS).map((c) => `
  <div class="row"><span class="face" style="background:${c.color}">${c.emoji}</span>
  <span class="nm">${c.name}<small>${c.hp > 1 ? `${c.hp}+ taps` : '1 tap'} · from wave ${c.unlock}</small></span>
  <b>${c.points}</b></div>`).join('');
$('powers').innerHTML = Object.entries(POWERUPS).map(([k, p]) => {
  const desc = { freeze: 'Freezes everyone for 4s', wall: 'Slows intruders for 7s', shield: 'Absorbs one breach (max 3)', charge: 'Fills the Sweep meter' }[k];
  return `<div class="row"><span class="face">${p.emoji}</span><span class="nm">${p.label.replace('!', '')}<small>${desc}</small></span></div>`;
}).join('');

updateBest();
show('menu');

// ----- PWA: install prompt + service worker
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('installBtn').classList.remove('hidden');
});
$('installBtn').onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $('installBtn').classList.add('hidden');
};
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (isIOS && !standalone) $('iosHint').classList.remove('hidden');

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
