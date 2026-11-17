import { Game } from './game.js';
import { LassoGame } from './lasso.js';
import { CHARACTERS, POWERUPS, TIERS } from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { unlockAudio, isMuted, setMuted, play as playSound, playMusic, stopMusic } from './audio.js';
import { t, fmt, getLang, setLang } from './i18n.js';
import { preloadImages, getSprite } from './assets.js';
import { CONFIG } from './config.js';
import {
  rankOf, headline, makeCardBlob, shareResult,
  whatsappUrl, facebookUrl, downloadCard,
} from './share.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

const screens = ['menu', 'heroSelect', 'quick', 'howto', 'pause', 'over'];
function show(id) {
  for (const s of screens) $(s).classList.toggle('hidden', s !== id);
  const playing = id === null;
  $('hud').classList.toggle('hidden', !playing && id !== 'pause');
  if (id === 'over') stopMusic();
  else if (id === null) playMusic('game');
  else if (id === 'menu' || id === 'howto' || id === 'heroSelect' || id === 'quick') playMusic('menu');
}

// Set when the page was opened from a shared link (see readLink).
let challenge = null; // { score, k, mode } from ?c=&k=&m=
let quickMode = null; // mode the #quick screen's PLAY button starts

// One delegated listener for menu button clicks (tap sound).
document.addEventListener('click', (e) => {
  if (e.target.closest('.panel button')) playSound('tap');
});

// ----- HUD
const hud = { locked: $('locked'), lives: $('lives'), score: $('score'), wave: $('wave'), combo: $('combo'), comboBar: $('comboBar'), shield: $('shield') };
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
    setText(hud.locked, 'locked', fmt(g.locked));
    setText(hud.lives, 'lives', '❤️'.repeat(g.lives) + '🖤'.repeat(g.maxLives - g.lives));
  }
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

let lastBest = 0;

/** Regenerate the card preview, debounced (language / art changes batch up). */
let cardTimer = 0;
let cardGen = 0;
let cardUrl = '';
let cardBlob = null; // the preview PNG, reused by the share button
function scheduleCardPreview() {
  clearTimeout(cardTimer);
  cardTimer = setTimeout(renderCardPreview, 120);
}
async function renderCardPreview() {
  const img = $('cardPreview');
  cardBlob = null;
  if (!lastResult) { img.classList.add('hidden'); return; }
  const gen = ++cardGen;
  try {
    const blob = await makeCardBlob(lastResult, 'post');
    if (gen !== cardGen) return; // superseded by a newer render
    if (cardUrl) URL.revokeObjectURL(cardUrl);
    cardBlob = blob;
    cardUrl = URL.createObjectURL(blob);
    img.src = cardUrl;
    img.classList.remove('hidden');
  } catch { img.classList.add('hidden'); }
}

function renderOver() {
  const s = lastResult;
  if (!s) return;
  const title = $('overTitle');
  title.classList.remove('good', 'bad');
  const who = s.intruderType ? t(`char.${s.intruderType}`) : '';
  $('overHeadline').textContent = headline(s);
  $('overRank').textContent = t('rank')[rankOf(s)];
  const vs = $('overVs');
  if (challenge && challenge.mode === s.mode) {
    const beaten = s.score > challenge.score;
    vs.textContent = beaten ? t('vsWin', { score: challenge.score }) : t('vsLose', { score: challenge.score });
    vs.className = beaten ? 'vs win' : 'vs lose';
  } else {
    vs.className = 'vs hidden';
  }
  if (s.mode === 'lasso') {
    title.textContent = s.won ? t('lWinTitle') : t('lLostTitle');
    title.classList.add(s.won ? 'good' : 'bad');
    $('overReason').textContent = s.won ? t('lWinReason', { time: s.time }) : t('lOverSneak');
    $('overStats').innerHTML = [
      ['sLocked', fmt(s.locked)], ['sLevel', fmt(s.level)],
      ['sLives', '❤️'.repeat(s.lives) || fmt(0)], ['sBest', fmt(lastBest)],
    ].map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join('');
  } else {
    title.textContent = t('overClassic');
    title.classList.add('bad');
    $('overReason').textContent = t('breachReason', { who, wave: s.wave });
    $('overStats').innerHTML = [
      ['sCaught', fmt(s.caught)], ['sMain', fmt(s.mains)],
      ['sCombo', fmt(s.bestCombo)], ['sBest', fmt(lastBest)],
    ].map(([k, v]) => `<div><span>${t(k)}</span><b>${v}</b></div>`).join('');
  }
  scheduleCardPreview();
}

// One game per mode on the same canvas; only the active one draws and takes input.
const hooks = { onHud, onBanner, onGameOver };
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
  $('waveLbl').dataset.i18n = m === 'lasso' ? 'hudLevel' : 'hudWave';
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
  if (['playing', 'paused'].includes(game.mode)) saveBest(game.score, game.wave);
  game.mode = 'menu'; game.reset(); show('menu'); updateBest();
}
$('menuBtn').onclick = toMenu;
$('quitBtn').onclick = toMenu;
$('pauseBtn').onclick = () => { game.pause(); show('pause'); };
$('resumeBtn').onclick = () => { game.resume(); show(null); };

const muteBtn = $('muteBtn');
const syncMute = () => { muteBtn.textContent = isMuted() ? '🔇' : '🔊'; };
muteBtn.onclick = () => { setMuted(!isMuted()); unlockAudio(); syncMute(); };
syncMute();

// ----- share buttons (system sheet / WhatsApp / Facebook / story download)
async function shareFromOver() {
  if (!lastResult) return;
  const result = await shareResult(lastResult, cardBlob);
  if (result === 'downloaded') onBanner(t('savedImg'), t('copiedSub'));
}
$('shareBtn').onclick = shareFromOver;
$('cardPreview').onclick = shareFromOver; // tapping the card shares it too
$('waBtn').onclick = () => lastResult && window.open(whatsappUrl(lastResult), '_blank', 'noopener');
$('fbBtn').onclick = () => lastResult && window.open(facebookUrl(lastResult), '_blank', 'noopener');
$('storyBtn').onclick = async () => {
  if (!lastResult) return;
  try { await downloadCard(lastResult, 'story'); onBanner(t('savedImg'), ''); } catch { /* ignore */ }
};
$('heroChangeBtn').onclick = () => { setMode(mode); renderHeroes(); show('heroSelect'); };

// ----- challenge / instant-play links (?c=&k=&m= or ?play=)
function readLink() {
  const q = new URLSearchParams(location.search);
  const c = parseInt(q.get('c'), 10);
  if (Number.isFinite(c)) {
    const k = parseInt(q.get('k'), 10);
    challenge = {
      score: Math.min(CONFIG.share.maxChallengeScore, Math.max(0, c)),
      k: Number.isFinite(k) ? Math.min(999, Math.max(0, k)) : 0,
      mode: q.get('m') === 'lasso' ? 'lasso' : 'classic',
    };
    quickMode = challenge.mode;
  } else if (q.get('play') === 'classic' || q.get('play') === 'lasso') {
    quickMode = q.get('play');
  }
  // A reload shows the normal menu instead of replaying the link.
  if (challenge || quickMode) history.replaceState(null, '', location.pathname);
  return !!(challenge || quickMode);
}

function renderQuick() {
  $('quickText').innerHTML = challenge
    ? t('challenge', { score: challenge.score, k: challenge.k, mode: t(challenge.mode === 'lasso' ? 'modeLasso' : 'modeClassic') })
    : t('tagline');
}
function startQuickPlay() {
  unlockAudio();
  setMode(quickMode || 'classic');
  play(selectedHero);
}
$('quickPlay').onclick = startQuickPlay;
$('quickMenu').onclick = () => show('menu');

// keyboard (desktop)
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && game.mode === 'playing') game.reverse?.();
  if (e.code === 'KeyP' || e.code === 'Escape') {
    if (game.mode === 'playing') { game.pause(); show('pause'); } else if (game.mode === 'paused') { game.resume(); show(null); }
  }
  if (e.code === 'Enter') {
    if (!$('heroSelect').classList.contains('hidden')) play(selectedHero);
    else if (!$('menu').classList.contains('hidden')) { renderHeroes(); show('heroSelect'); }
    else if (!$('quick').classList.contains('hidden')) startQuickPlay();
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
  renderQuick();
  renderHeroes();
}
$('langBtn').onclick = () => { setLang(getLang() === 'bn' ? 'en' : 'bn'); applyLang(); };

// Re-render sprite-based HTML once art has loaded (batched to one frame).
let artRefresh = 0;
preloadImages(() => {
  cancelAnimationFrame(artRefresh);
  artRefresh = requestAnimationFrame(() => applyLang());
});
const fromLink = readLink(); // parses ?c/?play first so applyLang can use it
setMode(mode);
applyLang();
show(fromLink ? 'quick' : 'menu');

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
