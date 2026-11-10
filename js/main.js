import { Game } from './game.js';
import { LassoGame } from './lasso.js';
import { CHARACTERS, POWERUPS, TIERS } from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { PERKS } from './perks.js';
import { unlockAudio, isMuted, setMuted, play as playSound, playMusic, stopMusic } from './audio.js';
import { t, fmt, getLang, setLang } from './i18n.js';
import { preloadImages, getSprite } from './assets.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const screens = ['menu', 'heroSelect', 'howto', 'pause', 'perk', 'over'];
function show(id) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== id);
  const playing = id === null;
  $('hud').classList.toggle('hidden', !playing && id !== 'pause' && id !== 'perk');
  $('sweepBtn').classList.toggle('hidden', !playing);
  if (id === 'over') stopMusic();
  else if (id === null) playMusic('game');
  else if (id === 'menu' || id === 'howto' || id === 'heroSelect') playMusic('menu');
}

// One delegated listener for menu button clicks (tap sound).
document.addEventListener('click', (e) => {
  if (e.target.closest('.panel button')) playSound('tap');
});

// ----- HUD
const hud = { timer: $('timer'), target: $('target'), score: $('score'), wave: $('wave'), combo: $('combo'), comboBar: $('comboBar'), shield: $('shield'), sweepFill: $('sweepFill'), sweepBtn: $('sweepBtn') };
const lastHud = {};
function setText(el, key, v) { if (lastHud[key] !== v) { lastHud[key] = v; el.textContent = v; } }
function onHud(g) {
  setText(hud.score, 'score', fmt(g.score));
  setText(hud.wave, 'wave', fmt(g.wave));
  const m = g.combo > 1 ? t('comboHud', { n: g.combo, m: g.multiplier() }) : '';
  setText(hud.combo, 'combo', m);
  const left = `${Math.round(g.comboLeft() * 100)}%`;
  if (lastHud.comboBar !== left) { lastHud.comboBar = left; hud.comboBar.style.width = left; }
  setText(hud.shield, 'shield', '🛡️'.repeat(g.shield));
  if (g instanceof LassoGame) {
    setText(hud.timer, 'timer', fmt(Math.ceil(g.roundT)));
    setText(hud.target, 'target', `${fmt(g.caughtRound)}/${fmt(g.target)}`);
  }
  const pct = `${g.sweep}%`;
  if (lastHud.sweep !== pct) { lastHud.sweep = pct; hud.sweepFill.style.width = pct; }
  hud.sweepBtn.classList.toggle('ready', g.sweep >= 100);
  if (g.mode === 'playing') {
    playMusic(g.enemies.some((e) => e.def.tier === 1) ? 'boss' : 'game');
  }
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

/** Save a run's score if it beats the stored best. Returns [isRecord, previousBest]. */
const bestKey = (m) => (m === 'lasso' ? 'kto-best-lasso' : 'kto-best');
function saveBest(score, wave) {
  const best = store.get(bestKey(mode), { score: 0, wave: 0 });
  const isRecord = score > best.score;
  if (isRecord) store.set(bestKey(mode), { score, wave });
  return [isRecord, best];
}

function onGameOver(s) {
  const [isRecord, best] = saveBest(s.score, s.wave);
  if (isRecord) playSound('record');
  $('overScore').textContent = fmt(s.score);
  $('overRecord').classList.toggle('hidden', !isRecord);
  lastResult = s;
  lastBest = Math.max(best.score, s.score);
  renderOver();
  show('over');
  updateBest();
}

// ----- upgrade choice between waves
let perkChoices = [];
function onPerks(options) {
  perkChoices = options;
  renderPerks();
  show('perk');
}
function renderPerks() {
  if (!perkChoices.length) return;
  $('perkSub').textContent = t('perkSub', { n: game.wave });
  $('perkList').innerHTML = perkChoices.map((id) => {
    const lvl = game.perks[id] || 0;
    const max = PERKS[id].max;
    return `<button class="perkBtn" data-perk="${id}"><span class="face">${PERKS[id].emoji}</span>
      <span class="nm">${t(`perkName.${id}`)}<small>${t(`perkDesc.${id}`)}</small></span>
      ${max < 99 ? `<span class="lvl">${fmt(lvl)}/${fmt(max)}</span>` : ''}</button>`;
  }).join('');
}
$('perkList').onclick = (e) => {
  const b = e.target.closest('[data-perk]');
  if (!b) return;
  perkChoices = [];
  show(null);
  game.choosePerk(b.dataset.perk);
};

let lastBest = 0;
function renderOver() {
  const s = lastResult;
  if (!s) return;
  const who = s.intruderType ? t(`char.${s.intruderType}`) : '';
  if (s.mode === 'lasso') {
    $('overReason').textContent = s.reason === 'escape'
      ? t('lOverEscape', { who, n: s.round })
      : t('lOverTarget', { n: s.caughtRound, target: s.target, round: s.round });
    $('overStats').innerHTML = [
      ['sRound', fmt(s.round)], ['sCaught', fmt(s.caught)], ['sEscaped', fmt(s.escaped)], ['sCombo', fmt(s.bestCombo)],
      ['sAcc', `${fmt(s.accuracy)}%`], ['sMain', fmt(s.mains)], ['sLost', fmt(s.lost)], ['sBest', fmt(lastBest)],
    ].map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join('');
    return;
  }
  $('overReason').textContent = t('breachReason', { who, wave: s.wave });
  $('overStats').innerHTML = [
    ['sWave', fmt(s.wave)], ['sCaught', fmt(s.caught)], ['sCombo', fmt(s.bestCombo)],
    ['sAcc', `${fmt(s.accuracy)}%`], ['sClose', fmt(s.closeCalls)], ['sMain', fmt(s.mains)], ['sPerks', fmt(s.perks)],
    ['sLeaked', fmt(s.leaked)], ['sLost', fmt(s.lost)],
    ['sBest', fmt(lastBest)],
  ].map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join('');
}

// One game per mode on the same canvas; only the active one draws and takes input.
const hooks = { onHud, onBanner, onGameOver, onPerks };
const games = { classic: new Game($('game'), hooks), lasso: new LassoGame($('game'), hooks) };
let mode = store.get('kto-mode', 'classic');
if (!games[mode]) mode = 'classic';
let game = games[mode];
games.lasso.active = mode === 'lasso';
games.classic.active = mode === 'classic';
window.__game = game; // handy for debugging from the console
let lastResult = null;

function setMode(m) {
  if (!games[m]) return;
  if (game !== games[m]) {
    game.active = false;
    game.mode = 'menu';
    game.reset();
    game = games[m];
    game.active = true;
    game.last = performance.now();
    window.__game = game;
  }
  mode = m;
  store.set('kto-mode', m);
  document.body.dataset.mode = m;
  $('waveLbl').dataset.i18n = m === 'lasso' ? 'hudRound' : 'hudWave';
  $('waveLbl').textContent = t($('waveLbl').dataset.i18n);
  for (const k of Object.keys(lastHud)) delete lastHud[k];
}

function updateBest() {
  const best = store.get('kto-best', { score: 0, wave: 0 });
  const bestL = store.get('kto-best-lasso', { score: 0, wave: 0 });
  const lines = [];
  if (best.score) lines.push(t('best', { score: best.score, wave: best.wave }));
  if (bestL.score) lines.push(t('bestLasso', { score: bestL.score, wave: bestL.wave }));
  $('bestLine').innerHTML = lines.length ? lines.join('<br>') : t('noBest');
}

function play(heroId = selectedHero) {
  unlockAudio();
  store.set('kto-hero', heroId);
  show(null);
  game.start(heroId);
}

let selectedHero = store.get('kto-hero', 'farmer');
if (!HEROES[selectedHero]) selectedHero = Object.keys(HEROES)[0];

function renderHeroes() {
  $('heroGrid').innerHTML = Object.entries(HEROES).map(([id, def]) => {
    const spr = getSprite(def, 'ready');
    const face = spr ? `<img src="${spr.src}" alt="">` : def.emoji;
    const style = spr ? '' : ` style="background:${def.color}"`;
    return `<button class="heroCard${id === selectedHero ? ' selected' : ''}" data-hero="${id}">
      <span class="face"${style}>${face}</span>
      <span class="nm">${t(`hero.${id}`)}</span>
      <span class="ds">${t(`heroDesc.${id}`)}</span>
    </button>`;
  }).join('');
}
$('heroGrid').onclick = (e) => {
  const b = e.target.closest('[data-hero]');
  if (!b) return;
  selectedHero = b.dataset.hero;
  store.set('kto-hero', selectedHero);
  renderHeroes();
};
$('heroGrid').ondblclick = (e) => {
  const b = e.target.closest('[data-hero]');
  if (!b) return;
  selectedHero = b.dataset.hero;
  store.set('kto-hero', selectedHero);
  play(selectedHero);
};

// ----- buttons
$('playBtn').onclick = () => { unlockAudio(); setMode('classic'); renderHeroes(); show('heroSelect'); };
$('playLassoBtn').onclick = () => { unlockAudio(); setMode('lasso'); renderHeroes(); show('heroSelect'); };
$('dirBtn').onclick = () => game.reverse?.();
$('startBtn').onclick = () => play(selectedHero);
$('againBtn').onclick = () => play(selectedHero);
$('howBtn').onclick = () => show('howto');
$('howBack').onclick = () => show('menu');
function toMenu() {
  // Quitting mid-run still counts towards the high score.
  if (['playing', 'paused', 'perk'].includes(game.mode)) saveBest(game.score, game.wave);
  game.mode = 'menu'; game.reset(); show('menu'); updateBest();
}
$('menuBtn').onclick = toMenu;
$('quitBtn').onclick = toMenu;
$('pauseBtn').onclick = () => { game.pause(); show('pause'); };
$('resumeBtn').onclick = () => { game.resume(); show(null); };
$('sweepBtn').onclick = () => game.useSweep();

const muteBtn = $('muteBtn');
const syncMute = () => { muteBtn.textContent = isMuted() ? '🔇' : '🔊'; };
muteBtn.onclick = () => { setMuted(!isMuted()); unlockAudio(); syncMute(); };
syncMute();

$('shareBtn').onclick = async () => {
  const s = lastResult;
  const text = s?.mode === 'lasso'
    ? t('lShareText', { round: s.round, score: s.score })
    : t('shareText', { wave: s?.wave ?? 1, score: s?.score ?? 0 });
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) await navigator.share({ title: t('title'), text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); onBanner(t('copied'), t('copiedSub')); }
  } catch { /* user cancelled */ }
};

// keyboard (desktop)
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); game.useSweep(); }
  if (e.code === 'KeyR' && game.mode === 'playing') game.reverse?.();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (game.mode === 'playing') { game.pause(); show('pause'); } else if (game.mode === 'paused') { game.resume(); show(null); }
  }
  if (e.code === 'Enter') {
    if (!$('heroSelect').classList.contains('hidden')) play(selectedHero);
    else if (!$('menu').classList.contains('hidden')) { renderHeroes(); show('heroSelect'); }
    else if (!$('over').classList.contains('hidden')) play(selectedHero);
  }
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
  $('lRules').innerHTML = t('lRules').map((li) => `<li>${li}</li>`).join('');
  $('roster').innerHTML = [1, 2, 3].map((tier) => {
    const note = TIERS[tier].gameOver ? t('tier1Note') : t('tierPenalty', { n: TIERS[tier].penalty });
    const rows = Object.entries(CHARACTERS).filter(([, c]) => c.tier === tier).map(([k, c]) => {
      const spr = getSprite(c, 'idle'); // falls back to the walk pose
      const face = spr ? `<img src="${spr.src}" alt="">` : c.emoji;
      const style = spr ? '' : ` style="background:${c.color}"`;
      return `<div class="row"><span class="face"${style}>${face}</span>
      <span class="nm">${t(`char.${k}`)}<small>${t(`trait.${k}`)} · ${c.hp > 1 ? t('taps', { n: `${fmt(c.hp)}+` }) : t('tap1')}${c.unlock ? ` · ${t('fromWave', { n: c.unlock })}` : ''}</small></span>
      <b>${fmt(c.points)} <small>${t('pts')}</small></b></div>`;
    }).join('');
    return `<div class="tier t${tier}"><div class="tierHead"><span>${t(`tier${tier}`)}</span><em>${note}</em></div>${rows}</div>`;
  }).join('');
  $('powers').innerHTML = Object.entries(POWERUPS).map(([k, p]) => `
    <div class="row"><span class="face">${p.emoji}</span>
    <span class="nm">${t(`puName.${k}`)}<small>${t(`puDesc.${k}`)}</small></span></div>`).join('');
  for (const k of Object.keys(lastHud)) delete lastHud[k];
  updateBest();
  renderOver();
  renderPerks();
  renderHeroes();
}
$('langBtn').onclick = () => { setLang(getLang() === 'bn' ? 'en' : 'bn'); applyLang(); };

// Re-render sprite-based HTML once art has loaded (batched to one frame).
let artRefresh = 0;
preloadImages(() => {
  cancelAnimationFrame(artRefresh);
  artRefresh = requestAnimationFrame(() => applyLang());
});
setMode(mode);
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
