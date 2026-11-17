// Share loop (PLAN-v3 phase 1): rank names, funny headlines, challenge links
// and a drawn share card (PNG) that goes through the system share sheet,
// WhatsApp/Facebook or a plain download. All card sizes scale from min(w,h).
import { CONFIG } from './config.js';
import { t, fmt } from './i18n.js';
import { getSprite } from './assets.js';
import { EMOJI_FONT } from './game.js';
import { HEROES } from './data/heroes.js';
import { CHARACTERS } from './data/enemies.js';

// "KTO Bangla" is the bundled Noto Sans Bengali (css/style.css, Bengali range only),
// so cards look the same on every device; Latin text falls through to system-ui.
const CARD_FONT = '"KTO Bangla", system-ui, "Noto Sans Bengali", "Hind Siliguri", sans-serif';
const CARD_SIZES = { post: [1080, 1350], story: [1080, 1920] };
// Host + path of the canonical URL, printed at the bottom of every card.
const URL_TEXT = (() => {
  try {
    const u = new URL(CONFIG.share.url);
    return `${u.host}${u.pathname}`.replace(/\/$/, '');
  } catch { return CONFIG.share.url; }
})();

const font = (weight, size) => `${weight} ${Math.round(size)}px ${CARD_FONT}`;
const shadow = (ctx, blur) => { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = blur; ctx.shadowOffsetY = blur * 0.15; };
const unshadow = (ctx) => { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; };

/** Rank 0..5 = number of CONFIG.share thresholds the run reached. */
export function rankOf(s) {
  const lasso = s?.mode === 'lasso';
  const thresholds = lasso ? CONFIG.share.ranksLasso : CONFIG.share.ranksClassic;
  const n = lasso ? (s.locked || 0) : (s.caught || 0);
  let rank = 0;
  for (const th of thresholds) if (n >= th) rank++;
  if (lasso && s.won) rank = Math.max(rank, CONFIG.share.lassoWinMinRank); // a win is at least rank 4
  return Math.min(rank, thresholds.length);
}

/** The funny one-liner for a run: classic leads with what the player did. */
export function headline(s) {
  if (s?.mode === 'lasso') return s.won ? t('hlLassoWin') : t('hlLasso', { n: s.locked || 0 });
  return s?.mains > 0 ? t('hlClassic', { tries: s.mainTries || s.mains, n: s.mains }) : t('hlClassic0');
}

/** Text for share sheets / WhatsApp / the clipboard. */
export function shareText(s) {
  return `${headline(s)} ${t('shareTail', { score: s.score, rank: t('rank')[rankOf(s)] })}`;
}

/** A link that challenges a friend to beat this run. */
export function challengeUrl(s) {
  return `${CONFIG.share.url}?c=${s.score}&k=${s.mains || 0}&m=${s.mode}`;
}

export function whatsappUrl(s) {
  return `https://wa.me/?text=${encodeURIComponent(`${shareText(s)} ${challengeUrl(s)}`)}`;
}

export function facebookUrl(s) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(challengeUrl(s))}`;
}

// ---------------------------------------------------------------- card drawing

/** Word-wrap with the current ctx font; Bangla text uses spaces, so this is enough. */
export function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [' '];
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A sprite centred at (x, y), rotated `rot`, or the def's emoji on a coloured circle. */
function drawFigure(ctx, img, def, x, y, size, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (rot) ctx.rotate(rot);
  if (img) {
    const ar = img.naturalWidth / img.naturalHeight || 1;
    const iw = size * ar;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = size * 0.12;
    ctx.drawImage(img, -iw / 2, -size / 2, iw, size);
  } else {
    const r = size / 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = def.color;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = size * 0.12;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.font = `${Math.round(size * 0.55)}px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(def.emoji, 0, size * 0.03);
  }
  ctx.restore();
}

/** Yellow 8-spike "impact" burst between the hero and the flying target. */
function drawStar(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#ffe15a';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** White motion lines trailing down-left from the kicked-away figure. */
function drawMotionLines(ctx, x, y, size) {
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(3, size * 0.05);
  for (let i = 0; i < 4; i++) {
    const len = size * (0.45 - i * 0.07);
    const ox = -size * (0.5 + i * 0.06);
    const oy = size * (0.38 - i * 0.24);
    ctx.globalAlpha = 0.85 - i * 0.16;
    ctx.beginPath();
    ctx.moveTo(x + ox, y + oy);
    ctx.lineTo(x + ox - len * 0.6, y + oy + len * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

/** Five dark vertical bars over Hasina (Rope 'Em! win): a jail cell. */
function drawJail(ctx, cx, cy, size, u) {
  const bw = size * 1.15;
  const bh = size * 1.3;
  const x0 = cx - bw / 2;
  const y0 = cy - bh / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(4,16,11,0.5)'; // dark backdrop so the bars read as a cell
  roundRect(ctx, x0, y0, bw, bh, u * 0.02);
  ctx.fill();
  ctx.fillStyle = '#122b1e';
  for (let i = 0; i < 5; i++) {
    const bx = x0 + bw * (0.13 + 0.185 * i);
    roundRect(ctx, bx - size * 0.045, y0 + u * 0.015, size * 0.09, bh - u * 0.03, size * 0.045);
    ctx.fill();
  }
  ctx.fillStyle = '#0d2218'; // top / bottom rails
  roundRect(ctx, x0 - u * 0.012, y0, bw + u * 0.024, u * 0.022, u * 0.011);
  ctx.fill();
  roundRect(ctx, x0 - u * 0.012, y0 + bh - u * 0.022, bw + u * 0.024, u * 0.022, u * 0.011);
  ctx.fill();
  ctx.restore();
}

/** Hero kicking + Hasina flying (or jailed after a Rope 'Em! win) on the flag disc. */
function drawCharacters(ctx, cx, cy, u, heroDef, lassoWin) {
  const size = u * 0.3;
  // Big soft Bangladesh-flag red disc behind the duo.
  const r = u * 0.42;
  const disc = ctx.createRadialGradient(cx, cy - u * 0.02, r * 0.3, cx, cy - u * 0.02, r);
  disc.addColorStop(0, 'rgba(244,42,65,0.92)');
  disc.addColorStop(0.75, 'rgba(244,42,65,0.85)');
  disc.addColorStop(1, 'rgba(244,42,65,0)');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy - u * 0.02, r, 0, Math.PI * 2);
  ctx.fill();

  const heroX = cx - u * 0.13;
  const heroY = cy + u * 0.06;
  const mainX = cx + u * 0.15;
  const mainY = cy - u * 0.07;
  const heroImg = getSprite(heroDef, 'kick'); // sprites face right: hero looks at Hasina
  const mainImg = getSprite(CHARACTERS.hasina, 'kicked');

  if (lassoWin) {
    drawFigure(ctx, mainImg, CHARACTERS.hasina, mainX, mainY, size * 0.95);
    drawJail(ctx, mainX, mainY, size, u);
  } else {
    drawMotionLines(ctx, mainX, mainY, size);
    drawFigure(ctx, mainImg, CHARACTERS.hasina, mainX, mainY, size, 25 * Math.PI / 180);
    drawStar(ctx, mainX - size * 0.32, mainY + size * 0.22, u * 0.05); // the kick lands here
  }
  // The hero leans forward into the kick (no kick pose art yet).
  drawFigure(ctx, heroImg, heroDef, heroX, heroY, size * 1.08, lassoWin ? 0 : 12 * Math.PI / 180);
}

function drawKicker(ctx, cx, baseline, size) {
  ctx.font = font(800, size);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7cffb2';
  shadow(ctx, size * 0.3);
  ctx.fillText(t('cardKicker').toUpperCase(), cx, baseline);
  unshadow(ctx);
}

function drawTitle(ctx, cx, baseline, size) {
  ctx.font = font(900, size);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  shadow(ctx, size * 0.25);
  ctx.fillText(t('title'), cx, baseline);
  unshadow(ctx);
}

function drawHeadLines(ctx, lines, cx, top, size) {
  ctx.font = font(800, size);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe15a';
  shadow(ctx, size * 0.3);
  let y = top;
  for (const line of lines) {
    ctx.fillText(line, cx, y + size);
    y += size * 1.3;
  }
  unshadow(ctx);
}

/** Big score + pts, the rank pill and the small stat line (skipped for promo). */
function drawScoreBlock(ctx, s, cx, y, f) {
  ctx.textAlign = 'left';
  const baseline = y + f.score;
  ctx.font = font(900, f.score);
  const num = fmt(s.score);
  const numW = ctx.measureText(num).width;
  ctx.font = font(700, f.small * 1.1);
  const pts = t('pts');
  const ptsW = ctx.measureText(pts).width;
  const gap = f.small * 0.5;
  const x0 = cx - (numW + gap + ptsW) / 2;
  shadow(ctx, f.score * 0.16);
  ctx.fillStyle = '#fff';
  ctx.font = font(900, f.score);
  ctx.fillText(num, x0, baseline);
  ctx.font = font(700, f.small * 1.1);
  ctx.fillText(pts, x0 + numW + gap, baseline);
  unshadow(ctx);

  const label = t('rank')[rankOf(s)];
  ctx.font = font(800, f.small * 1.05);
  const pillW = ctx.measureText(label).width + f.small * 2.2;
  const pillH = f.small * 1.9;
  const py = baseline + f.small * 0.9;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, cx - pillW / 2, py, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = '#ffe15a';
  ctx.lineWidth = Math.max(2, f.small * 0.08);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe15a';
  ctx.fillText(label, cx, py + pillH * 0.68);

  const stat = s.mode === 'lasso'
    ? t('cardStatsLasso', { locked: s.locked || 0, level: s.level || 1 })
    : t('cardStatsClassic', { caught: s.caught || 0, wave: s.wave || 1 });
  ctx.font = font(600, f.small);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(stat, cx, py + pillH + f.small * 1.2);
}

function drawFooter(ctx, cx, h, u) {
  const ctaSize = u * 0.036;
  const urlSize = u * 0.032;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = font(800, ctaSize);
  const yUrl = h - u * 0.045;
  ctx.fillText(t('cardCta'), cx, yUrl - urlSize * 1.5);
  ctx.globalAlpha = 0.7;
  ctx.font = font(700, urlSize);
  ctx.fillText(URL_TEXT, cx, yUrl);
  ctx.globalAlpha = 1;
}

/**
 * Draw a share card. `data` is a game summary or `{ promo: true }`.
 * Portrait (1080×1350 / 1080×1920) stacks everything; landscape (1200×630,
 * link previews) puts the characters on the left half and text on the right.
 */
export function drawCard(ctx, w, h, data) {
  const u = Math.min(w, h);
  const s = data && data.promo ? null : data;
  const heroDef = HEROES[s?.hero] || HEROES.farmer;
  const lassoWin = s?.mode === 'lasso' && s.won;
  const portrait = h >= w;
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Background: deep green with a big soft flag-red disc behind the characters.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b3d2a');
  bg.addColorStop(1, '#0f6a45');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const f = {
    kicker: u * (portrait ? 0.03 : 0.028),
    title: u * (portrait ? 0.105 : 0.1),
    head: u * (portrait ? 0.048 : 0.045),
    score: u * (portrait ? 0.13 : 0.105),
    small: u * (portrait ? 0.034 : 0.033),
  };
  const pad = u * 0.07;
  const colW = portrait ? w - pad * 2 : w * 0.5 - pad; // text column width
  const cx = portrait ? w / 2 : w * 0.5 + colW / 2;    // text column centre

  // Headline wrap (measured with its real font) and a title that shrinks to fit
  // so Bangla text is never clipped.
  const headLine = s ? headline(s) : t('cardPromo');
  ctx.font = font(800, f.head);
  const lines = wrapText(ctx, headLine, colW);
  const titleMax = portrait ? w - pad : colW;
  let tf = f.title;
  ctx.font = font(900, tf);
  while (tf > u * 0.05 && ctx.measureText(t('title')).width > titleMax) {
    tf -= u * 0.004;
    ctx.font = font(900, tf);
  }

  if (portrait) {
    // Distribute the blocks between the top edge and the footer.
    const kickerH = f.kicker * 1.35;
    const titleH = tf * 1.15;
    let bandH = Math.max(u * 0.3, Math.min(h * 0.26, u * 0.46)); // character band
    const headH = lines.length * f.head * 1.3 + u * 0.02;
    const scoreH = s ? f.score + u * 0.085 + f.small * 1.4 : 0;
    const y0 = u * 0.045;
    const y1 = h - u * 0.13 - u * 0.05;
    let total = kickerH + titleH + bandH + headH + scoreH;
    if (total > y1 - y0) bandH = Math.max(u * 0.22, bandH - (total - (y1 - y0))); // long wrap: shrink art first
    total = kickerH + titleH + bandH + headH + scoreH;
    const gaps = s ? 4 : 3;
    const gap = Math.max(u * 0.018, Math.min(u * 0.06, (y1 - y0 - total) / gaps));
    let y = y0 + Math.max(0, (y1 - y0 - total - gap * gaps) * 0.4); // story cards breathe

    const yKicker = y + f.kicker;
    y += kickerH + gap;
    const yTitle = y + tf * 0.9;
    y += titleH + gap;
    // Art first: the translucent flag disc must sit behind the title, not over it.
    drawCharacters(ctx, w / 2, y + bandH / 2, u, heroDef, lassoWin);
    drawKicker(ctx, cx, yKicker, f.kicker);
    drawTitle(ctx, cx, yTitle, tf);
    y += bandH + gap;
    drawHeadLines(ctx, lines, cx, y, f.head);
    y += headH + gap;
    if (s) drawScoreBlock(ctx, s, cx, y, f);
  } else {
    drawCharacters(ctx, w * 0.26, h * 0.55, u, heroDef, lassoWin);
    // The promo (link preview) has no score block, so its text sits lower, centred.
    const top = h * (s ? 0.14 : 0.27);
    drawKicker(ctx, cx, top, f.kicker);
    drawTitle(ctx, cx, top + f.kicker * 1.5 + tf * 0.9, tf);
    drawHeadLines(ctx, lines, cx, top + f.kicker * 1.5 + tf * 1.3, f.head);
    if (s) {
      drawScoreBlock(ctx, s, cx, top + f.kicker * 1.5 + tf * 1.3 + lines.length * f.head * 1.3 + u * 0.02, f);
    }
  }
  drawFooter(ctx, cx, h, u);
  ctx.restore();
}

// ---------------------------------------------------------------- card export

/** Load the bundled Bangla font before drawing (canvas doesn't wait for fonts). */
export async function ensureCardFont() {
  try { await document.fonts.load('800 40px "KTO Bangla"', 'বাংলা'); } catch { /* fall back */ }
}

/** Off-screen PNG of the share card: 'post' (1080×1350) or 'story' (1080×1920). */
export async function makeCardBlob(s, size = 'post') {
  const [w, h] = CARD_SIZES[size] || CARD_SIZES.post;
  await ensureCardFont();
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCard(canvas.getContext('2d'), w, h, s);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Save a card PNG to downloads (the "Story image" button). */
export async function downloadCard(s, size = 'post') {
  triggerDownload(await makeCardBlob(s, size), `keep-them-out-${size}.png`);
}

/**
 * Share the run: image + text through the system sheet when possible, a
 * text-only share next, download + clipboard as the last resort.
 * Returns 'shared' | 'downloaded' | 'cancelled'; never throws.
 * Pass the already-rendered preview `blob` when there is one: Safari only opens
 * the share sheet while the tap's user activation is fresh, so no await first.
 */
export async function shareResult(s, blob = null) {
  const text = `${shareText(s)} ${challengeUrl(s)}`;
  try {
    if (!blob) blob = await makeCardBlob(s, 'post');
    const file = new File([blob], 'keep-them-out.png', { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ text: shareText(s), url: challengeUrl(s) });
      return 'shared';
    }
    triggerDownload(blob, 'keep-them-out.png');
    try { await navigator.clipboard?.writeText(text); } catch { /* clipboard needs a gesture */ }
    return 'downloaded';
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled';
    try { await downloadCard(s, 'post'); } catch { /* nothing more we can do */ }
    return 'downloaded';
  }
}
