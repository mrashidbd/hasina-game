import { Game } from './game.js';
import { CHARACTERS, POWERUPS } from './characters.js';
import { unlockAudio, isMuted, setMuted } from './audio.js';
import { t, fmt, getLang, setLang } from './i18n.js';

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
  setText(hud.score, 'score', fmt(g.score));
  setText(hud.wave, 'wave', fmt(g.wave));
  const m = g.combo > 1 ? t('comboHud', { n: g.combo, m: g.multiplier() }) : '';
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
  $('overScore').textContent = fmt(s.score);
  $('overRecord').classList.toggle('hidden', !isRecord);
  lastResult = s;
  lastBest = Math.max(best.score, s.score);
  renderOver();
  show('over');
  updateBest();
}

let lastBest = 0;
function renderOver() {
  const s = lastResult;
  if (!s) return;
  $('overReason').textContent = t('breachReason', { who: s.intruderType ? t(`char.${s.intruderType}`).toLowerCase() : '', wave: s.wave });
  $('overStats').innerHTML = [
    ['sWave', fmt(s.wave)], ['sCaught', fmt(s.caught)], ['sCombo', fmt(s.bestCombo)],
    ['sAcc', `${fmt(s.accuracy)}%`], ['sClose', fmt(s.closeCalls)], ['sBoss', fmt(s.bosses)],
    ['sBest', fmt(lastBest)],
  ].map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join('');
}

const game = new Game($('game'), { onHud, onBanner, onGameOver });
window.__game = game; // handy for debugging from the console
let lastResult = null;

function updateBest() {
  const best = store.get('kto-best', { score: 0, wave: 0 });
  $('bestLine').textContent = best.score ? t('best', { score: best.score, wave: best.wave }) : t('noBest');
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
  const text = t('shareText', { wave: s?.wave ?? 1, score: s?.score ?? 0 });
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ title: t('title'), text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); onBanner(t('copied'), t('copiedSub')); }
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

// ----- language: static text (data-i18n), how-to tables, dynamic lines
function applyLang() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.title = t('title');
  for (const el of document.querySelectorAll('[data-i18n]')) el.innerHTML = t(el.dataset.i18n);
  $('rules').innerHTML = t('rules').map((li) => `<li>${li}</li>`).join('');
  $('roster').innerHTML = Object.entries(CHARACTERS).map(([k, c]) => `
    <div class="row"><span class="face" style="background:${c.color}">${c.emoji}</span>
    <span class="nm">${t(`char.${k}`)}<small>${c.hp > 1 ? t('taps', { n: `${fmt(c.hp)}+` }) : t('tap1')} · ${t('fromWave', { n: c.unlock })}</small></span>
    <b>${fmt(c.points)} <small>${t('pts')}</small></b></div>`).join('');
  $('powers').innerHTML = Object.entries(POWERUPS).map(([k, p]) => `
    <div class="row"><span class="face">${p.emoji}</span>
    <span class="nm">${t(`puName.${k}`)}<small>${t(`puDesc.${k}`)}</small></span></div>`).join('');
  for (const k of Object.keys(lastHud)) delete lastHud[k];
  updateBest();
  renderOver();
}
$('langBtn').onclick = () => { setLang(getLang() === 'bn' ? 'en' : 'bn'); applyLang(); };

applyLang();
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
