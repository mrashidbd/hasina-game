import {
  BD, SEA, MYANMAR, INDIA_EDGES, INDIA_LEN, DHAKA, LABELS, BBOX, pointInPoly, distToPoly,
} from './map.js';
import {
  CHARACTERS, POWERUPS, MAIN_ID, penaltyOf, isMainWave,
} from './characters.js';
import { sfx } from './audio.js';
import { t as tr, fmt } from './i18n.js';

const PAD = 0.7;            // map units of "India" kept visible around Bangladesh
const SPAWN_MIN = 0.5;      // spawn distance outside the border (map units)
const SPAWN_MAX = 0.8;
const SPAWN_NOMINAL = (SPAWN_MIN + SPAWN_MAX) / 2;
const COMBO_WINDOW = 1.5;   // seconds between catches to keep a combo
const CLOSE_CALL = 0.12;    // distance to border that counts as a close call
const DANGER = 0.18;        // distance at which an intruder is flagged as dangerous
const POWERUP_CHANCE = 0.07;
const MAX_SHIELD = 3;
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function weighted(pool) {
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of pool) { if ((r -= w) <= 0) return k; }
  return pool[0][0];
}

export class Game {
  constructor(canvas, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.hooks = hooks; // onHud, onBanner, onGameOver
    this.mode = 'menu';
    this.insets = { top: 64, bottom: 90 };
    this.reset();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  reset() {
    this.score = 0;
    this.wave = 0;
    this.time = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastCatch = -10;
    this.sweep = 0;
    this.shield = 0;
    this.freezeT = 0;
    this.wallT = 0;
    this.enemies = [];
    this.particles = [];
    this.floaters = [];
    this.powerups = [];
    this.queue = [];
    this.spawnT = 0;
    this.breakT = 0;
    this.shake = 0;
    this.flash = 0;
    this.breachAt = null;
    this.stats = { caught: 0, taps: 0, hits: 0, closeCalls: 0, mains: 0, leaked: 0, lost: 0 };
    this.waveStats = { taps: 0, hits: 0, leaks: 0 };
    this.mainCount = 0;
    this.leakFlash = 0;
  }

  // ---------------------------------------------------------------- layout
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const top = this.insets.top;
    const bottom = this.insets.bottom;
    const mw = BBOX.maxX - BBOX.minX + PAD * 2;
    const mh = BBOX.maxY - BBOX.minY + PAD * 2;
    const availH = Math.max(100, h - top - bottom);
    this.s = Math.min(w / mw, availH / mh);
    const cx = (BBOX.minX + BBOX.maxX) / 2;
    const cy = (BBOX.minY + BBOX.maxY) / 2;
    this.ox = w / 2 - cx * this.s;
    this.oy = top + availH / 2 - cy * this.s;
    // visible area in map units (used to keep spawns on screen)
    this.view = {
      minX: (0 - this.ox) / this.s, maxX: (w - this.ox) / this.s,
      minY: (top - this.oy) / this.s, maxY: (h - bottom - this.oy) / this.s,
    };
    this.buildPaths();
  }

  buildPaths() {
    const mk = (poly) => {
      const p = new Path2D();
      poly.forEach(([x, y], i) => (i ? p.lineTo : p.moveTo).call(p, this.sx(x), this.sy(y)));
      p.closePath();
      return p;
    };
    this.bdPath = mk(BD);
    this.seaPath = mk(SEA);
    this.myPath = mk(MYANMAR);
    this.indiaBorder = new Path2D();
    for (const e of INDIA_EDGES) {
      this.indiaBorder.moveTo(this.sx(e.a[0]), this.sy(e.a[1]));
      this.indiaBorder.lineTo(this.sx(e.b[0]), this.sy(e.b[1]));
    }
  }

  sx(x) { return this.ox + x * this.s; }
  sy(y) { return this.oy + y * this.s; }
  rpx(r) { return Math.max(r * this.s, 15); }

  // ---------------------------------------------------------------- flow
  start() {
    this.reset();
    this.mode = 'playing';
    this.nextWave();
  }

  pause() { if (this.mode === 'playing') this.mode = 'paused'; }
  resume() { if (this.mode === 'paused') { this.mode = 'playing'; this.last = performance.now(); } }

  nextWave() {
    this.wave += 1;
    const n = this.wave;
    this.waveStats = { taps: 0, hits: 0, leaks: 0 };
    const count = 5 + Math.floor(n * 1.8);
    // Weighting: the basic small leader is the backbone; other small leaders grow
    // with the wave number, senior leaders grow more slowly.
    const pool = Object.entries(CHARACTERS)
      .filter(([, c]) => c.tier > 1 && n >= c.unlock)
      .map(([k, c]) => [k, k === 'small1' ? 10 : c.tier === 3 ? 2 + n * 0.6 : 1 + n * 0.35]);
    const q = [];
    for (let i = 0; i < count; i++) q.push(weighted(pool));
    const main = isMainWave(n);
    if (main) q.splice(Math.floor(q.length / 2), 0, MAIN_ID);
    this.queue = q;
    this.spawnInterval = Math.max(0.3, 1.5 * Math.pow(0.92, n - 1));
    this.speedMul = Math.min(2.1, 1 + 0.07 * (n - 1));
    this.spawnT = 1.2;
    this.hooks.onBanner?.(tr('wave', { n }), main ? tr('mainIncoming') : tr('nIntruders', { n: q.length }));
    sfx.wave();
  }

  waveCleared() {
    const n = this.wave;
    let bonus = 50 * n;
    const acc = this.waveStats.taps ? this.waveStats.hits / this.waveStats.taps : 1;
    let sub = tr('clearBonus', { n: bonus });
    if (acc >= 0.9) { bonus += 25 * n; sub += ` · ${tr('sharp', { n: 25 * n })}`; }
    if (!this.waveStats.leaks) { bonus += 30 * n; sub += ` · ${tr('noLeaks', { n: 30 * n })}`; }
    this.score += bonus;
    this.hooks.onBanner?.(tr('cleared', { n }), sub);
    this.breakT = 2.4;
  }

  // ---------------------------------------------------------------- spawning
  spawnPoint() {
    const v = this.view;
    const m = 0.06;
    for (let tries = 0; tries < 40; tries++) {
      let r = Math.random() * INDIA_LEN;
      let edge = INDIA_EDGES[0];
      for (const e of INDIA_EDGES) { if ((r -= e.len) <= 0) { edge = e; break; } }
      const t = Math.random();
      const px = edge.a[0] + (edge.b[0] - edge.a[0]) * t;
      const py = edge.a[1] + (edge.b[1] - edge.a[1]) * t;
      let nx = -(edge.b[1] - edge.a[1]) / edge.len;
      let ny = (edge.b[0] - edge.a[0]) / edge.len;
      if (pointInPoly(BD, px + nx * 0.02, py + ny * 0.02)) { nx = -nx; ny = -ny; }
      const d = rand(SPAWN_MIN, SPAWN_MAX);
      const x = clamp(px + nx * d, v.minX + m, v.maxX - m);
      const y = clamp(py + ny * d, v.minY + m, v.maxY - m);
      if (pointInPoly(BD, x, y) || pointInPoly(SEA, x, y) || pointInPoly(MYANMAR, x, y)) continue;
      if (distToPoly(BD, x, y) < 0.3) continue;
      return { x, y, tx: px - nx * 0.05, ty: py - ny * 0.05 };
    }
    return null;
  }

  spawn(type, at = null) {
    const def = CHARACTERS[type];
    const p = at || this.spawnPoint();
    if (!p) return;
    // On narrow screens a spawn can be clamped close to the border. Scale speed so the
    // time-to-border stays about the same as on a large screen (fair on phones).
    let fair = 1;
    if (!at) fair = clamp(Math.hypot(p.tx - p.x, p.ty - p.y) / SPAWN_NOMINAL, 0.5, 1);
    const e = {
      type, def,
      x: p.x, y: p.y, tx: p.tx, ty: p.ty, phase: 0,
      hp: def.hp, maxHp: def.hp, r: def.radius,
      speed: def.speed * this.speedMul * fair * rand(0.9, 1.1),
      t: 0, seed: Math.random() * 10, hitFlash: 0, summonT: def.summons?.every ?? 0,
      home: { x: p.x, y: p.y },
    };
    if (def.tier === 1) {
      e.hp = e.maxHp = def.hp + this.mainCount * 5; // tougher every appearance
      this.mainCount++;
      sfx.boss();
      navigator.vibrate?.(80);
    }
    this.enemies.push(e);
    // packs: spawn the rest of the group next to the first one
    if (!at && def.group > 1) {
      for (let i = 1; i < def.group; i++) {
        const a = Math.random() * Math.PI * 2;
        this.spawn(type, {
          x: p.x + Math.cos(a) * 0.12, y: p.y + Math.sin(a) * 0.12,
          tx: p.tx + rand(-0.1, 0.1), ty: p.ty + rand(-0.1, 0.1),
        });
      }
    }
  }

  // ---------------------------------------------------------------- input
  onPointer(ev) {
    if (this.mode !== 'playing') return;
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;

    // power-ups first
    for (const pu of this.powerups) {
      if (Math.hypot(this.sx(pu.x) - px, this.sy(pu.y) - py) < 30) {
        this.collect(pu);
        return;
      }
    }

    this.stats.taps++; this.waveStats.taps++;
    let best = null; let bestD = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(this.sx(e.x) - px, this.sy(e.y) - py);
      const hitR = Math.max(this.rpx(e.r) * 1.25, 26);
      if (d < hitR && d < bestD) { best = e; bestD = d; }
    }
    if (!best) {
      if (this.combo > 0) this.floater(px, py, tr('comboLost'), '#ff8a8a', 0.6, true);
      this.combo = 0;
      sfx.miss();
      this.ripple(px, py);
      return;
    }
    this.stats.hits++; this.waveStats.hits++;
    this.damage(best, 1);
  }

  damage(e, amount, viaSweep = false) {
    e.hp -= amount;
    e.hitFlash = 0.15;
    if (e.hp > 0) {
      sfx.hit();
      // knock back away from the border
      const dx = e.x - e.tx, dy = e.y - e.ty;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * 0.035; e.y += (dy / d) * 0.035;
      if (e.def.dash) { // jump sideways, so the next tap has to chase it
        const side = Math.random() < 0.5 ? -1 : 1;
        e.x += (-dy / d) * 0.16 * side; e.y += (dx / d) * 0.16 * side;
        if (pointInPoly(BD, e.x, e.y)) { e.x -= (-dy / d) * 0.32 * side; e.y -= (dx / d) * 0.32 * side; }
      }
      this.burst(e.x, e.y, e.def.color, 6);
      return;
    }
    this.catch(e, viaSweep);
  }

  catch(e, viaSweep = false) {
    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (this.time - this.lastCatch < COMBO_WINDOW) this.combo++; else this.combo = 1;
    this.lastCatch = this.time;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const mult = this.multiplier();
    let pts = viaSweep ? Math.round(e.def.points * 0.5) : e.def.points * mult;
    const near = distToPoly(BD, e.x, e.y);
    let label = `+${fmt(pts)}`;
    if (!viaSweep && near < CLOSE_CALL) {
      pts += 25; this.stats.closeCalls++; label = `+${fmt(pts)} ${tr('closeCall')}`;
    }
    const isMain = e.def.tier === 1;
    if (isMain) this.stats.mains++;
    this.score += pts;
    this.stats.caught++;
    if (!viaSweep) this.sweep = Math.min(100, this.sweep + e.def.sweepGain);
    this.floater(this.sx(e.x), this.sy(e.y) - 20, label, mult > 1 ? '#ffe15a' : '#ffffff', isMain ? 1.6 : 1);
    this.burst(e.x, e.y, e.def.color, isMain ? 40 : 14);
    sfx.catch(this.combo);
    if (isMain) { this.shake = 0.4; navigator.vibrate?.([40, 30, 40]); }
    if (!viaSweep && Math.random() < (isMain ? 1 : POWERUP_CHANCE)) this.dropPowerup(e.x, e.y);
  }

  multiplier() { return Math.min(5, 1 + Math.floor((this.combo - 1) / 5)); }

  useSweep() {
    if (this.mode !== 'playing' || this.sweep < 100) return;
    this.sweep = 0;
    this.flash = 0.5;
    sfx.sweep();
    navigator.vibrate?.(60);
    for (const e of [...this.enemies]) {
      if (e.def.tier === 1) this.damage(e, 4, true);
      else this.damage(e, 99, true);
    }
  }

  dropPowerup(x, y) {
    const kinds = Object.keys(POWERUPS).filter((k) => k !== 'shield' || this.shield < MAX_SHIELD);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.powerups.push({ kind, x, y, t: 0, life: 6 });
  }

  collect(pu) {
    this.powerups.splice(this.powerups.indexOf(pu), 1);
    const def = POWERUPS[pu.kind];
    if (pu.kind === 'freeze') this.freezeT = 4;
    if (pu.kind === 'wall') this.wallT = 7;
    if (pu.kind === 'shield') this.shield = Math.min(MAX_SHIELD, this.shield + 1);
    if (pu.kind === 'charge') this.sweep = Math.min(100, this.sweep + 40);
    this.floater(this.sx(pu.x), this.sy(pu.y) - 24, tr(`pu.${pu.kind}`), def.color, 1.2);
    this.burst(pu.x, pu.y, def.color, 16);
    sfx.power();
  }

  breach(e) {
    // Tier 2 / 3: they get in, you lose points, the game goes on.
    if (e.def.tier > 1) {
      this.enemies.splice(this.enemies.indexOf(e), 1);
      const pen = penaltyOf(e.def);
      const lost = Math.min(pen, this.score);
      this.score -= lost;
      this.stats.leaked++; this.stats.lost += lost; this.waveStats.leaks++;
      this.combo = 0;
      this.leakFlash = 0.35;
      this.shake = Math.max(this.shake, e.def.tier === 2 ? 0.3 : 0.15);
      sfx.leak();
      navigator.vibrate?.(50);
      this.floater(this.sx(e.x), this.sy(e.y) - 20, `−${fmt(pen)} ${tr('leaked')}`, '#ff5a6a', e.def.tier === 2 ? 1.3 : 1);
      this.burst(e.x, e.y, '#ff5a6a', 12);
      return;
    }
    // Tier 1: a shield throws her back to where she started; otherwise game over.
    if (this.shield > 0) {
      this.shield--;
      this.shake = 0.5;
      this.flash = 0.3;
      sfx.shield();
      navigator.vibrate?.(120);
      this.floater(this.sx(e.x), this.sy(e.y) - 20, tr('shieldBroken'), '#7cffb2', 1.3);
      this.burst(e.x, e.y, '#7cffb2', 24);
      e.x = e.home.x; e.y = e.home.y; e.phase = 0;
      return;
    }
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.breachAt = { x: e.x, y: e.y, def: e.def, type: e.type };
    this.mode = 'over';
    this.shake = 0.8;
    sfx.over();
    navigator.vibrate?.([200, 80, 200]);
    setTimeout(() => this.hooks.onGameOver?.(this.summary()), 1100);
  }

  summary() {
    return {
      score: this.score, wave: this.wave, bestCombo: this.bestCombo, ...this.stats,
      accuracy: this.stats.taps ? Math.round((this.stats.hits / this.stats.taps) * 100) : 0,
      intruderType: this.breachAt?.type ?? '',
    };
  }

  // ---------------------------------------------------------------- update
  update(dt) {
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.leakFlash = Math.max(0, this.leakFlash - dt);
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) { f.y -= 40 * dt; f.life -= dt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    if (this.mode !== 'playing') return;
    this.time += dt;
    this.freezeT = Math.max(0, this.freezeT - dt);
    this.wallT = Math.max(0, this.wallT - dt);
    if (this.time - this.lastCatch > COMBO_WINDOW) this.combo = 0;

    // waves
    if (this.breakT > 0) {
      this.breakT -= dt;
      if (this.breakT <= 0) this.nextWave();
    } else if (this.queue.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawn(this.queue.shift());
        if (this.wave >= 6 && this.queue.length && Math.random() < 0.2) this.spawn(this.queue.shift());
        this.spawnT = this.spawnInterval * rand(0.7, 1.3);
      }
    } else if (!this.enemies.length) {
      this.waveCleared();
    }

    // power-ups expire
    for (const pu of this.powerups) pu.t += dt;
    this.powerups = this.powerups.filter((pu) => pu.t < pu.life);

    // intruders
    const frozen = this.freezeT > 0;
    const slow = this.wallT > 0 ? 0.4 : 1;
    for (const e of [...this.enemies]) {
      e.t += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (frozen) continue;
      const tx = e.phase === 0 ? e.tx : DHAKA[0];
      const ty = e.phase === 0 ? e.ty : DHAKA[1];
      const dx = tx - e.x, dy = ty - e.y;
      const d = Math.hypot(dx, dy) || 1;
      if (e.phase === 0 && d < 0.03) e.phase = 1;
      const spd = e.speed * slow;
      let vx = (dx / d) * spd, vy = (dy / d) * spd;
      if (e.def.wobble) {
        const w = Math.sin(e.t * 5 + e.seed) * spd * 0.8;
        vx += (-dy / d) * w; vy += (dx / d) * w;
      }
      e.x += vx * dt; e.y += vy * dt;
      e.near = distToPoly(BD, e.x, e.y);
      if (e.def.summons) {
        e.summonT -= dt;
        if (e.summonT <= 0) {
          e.summonT = Math.max(1.8, e.def.summons.every - this.wave * 0.05);
          const kinds = e.def.summons.types;
          const a = Math.random() * Math.PI * 2;
          this.spawn(kinds[Math.floor(Math.random() * kinds.length)], {
            x: e.x + Math.cos(a) * 0.15, y: e.y + Math.sin(a) * 0.15, tx: e.tx + rand(-0.15, 0.15), ty: e.ty + rand(-0.15, 0.15),
          });
        }
      }
      if (pointInPoly(BD, e.x, e.y)) {
        this.breach(e);
        if (this.mode !== 'playing') return;
      }
    }
  }

  // ---------------------------------------------------------------- effects
  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(60, 260);
      this.particles.push({
        x: this.sx(x), y: this.sy(y), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.3, 0.7), max: 0.7, color, size: rand(2, 5),
      });
    }
  }

  ripple(px, py) {
    this.particles.push({ x: px, y: py, vx: 0, vy: 0, life: 0.3, max: 0.3, color: '#ffffff', ring: true, size: 4 });
  }

  floater(x, y, text, color, scale = 1, small = false) {
    this.floaters.push({ x, y, text, color, life: 0.9, scale: small ? 0.7 : scale });
  }

  // ---------------------------------------------------------------- render
  render() {
    const { ctx, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.shake > 0) {
      const m = this.shake * 12;
      ctx.translate(rand(-m, m), rand(-m, m));
    }
    const t = performance.now() / 1000;

    // India (background)
    ctx.fillStyle = '#2b2633';
    ctx.fillRect(-20, -20, this.w + 40, this.h + 40);
    ctx.fillStyle = '#332d3c';
    ctx.fill(this.myPath);
    // sea
    const sea = ctx.createLinearGradient(0, this.sy(BBOX.maxY - 1), 0, this.h);
    sea.addColorStop(0, '#12476b');
    sea.addColorStop(1, '#0a2a44');
    ctx.fillStyle = sea;
    ctx.fill(this.seaPath);

    // labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.max(10, this.s * 0.11)}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (const l of LABELS) ctx.fillText(l.text, this.sx(l.at[0]), this.sy(l.at[1]));

    // Bangladesh
    ctx.save();
    ctx.fillStyle = '#0f6a45';
    ctx.fill(this.bdPath);
    ctx.clip(this.bdPath);
    ctx.fillStyle = 'rgba(218,26,52,0.82)';
    ctx.beginPath();
    ctx.arc(this.sx(DHAKA[0] - 0.15), this.sy(DHAKA[1]), this.s * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // border
    const danger = this.enemies.some((e) => e.near < DANGER);
    const mainDanger = this.enemies.some((e) => e.def.tier === 1 && e.near < DANGER * 2);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke(this.bdPath);
    ctx.lineWidth = this.wallT > 0 ? 7 : 3;
    ctx.strokeStyle = this.wallT > 0 ? '#e0894a' : danger ? `rgba(255,${80 + 60 * Math.sin(t * 12)},80,1)` : '#7cffb2';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 12;
    ctx.stroke(this.indiaBorder);
    ctx.shadowBlur = 0;

    // Dhaka
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.sx(DHAKA[0]), this.sy(DHAKA[1]), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `600 ${Math.max(10, this.s * 0.09)}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('Dhaka', this.sx(DHAKA[0]), this.sy(DHAKA[1]) + Math.max(12, this.s * 0.1));

    // power-ups
    for (const pu of this.powerups) {
      const x = this.sx(pu.x), y = this.sy(pu.y);
      const fade = pu.life - pu.t < 1.5 ? (Math.sin(t * 20) > 0 ? 1 : 0.3) : 1;
      const r = 18 + Math.sin(t * 6) * 2;
      ctx.globalAlpha = fade;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.strokeStyle = POWERUPS[pu.kind].color;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = `20px ${EMOJI_FONT}`;
      ctx.fillText(POWERUPS[pu.kind].emoji, x, y + 1);
      ctx.globalAlpha = 1;
    }

    // intruders
    for (const e of this.enemies) this.drawEnemy(e, t);
    if (this.mode === 'playing' && this.stats.caught === 0 && this.enemies.length) {
      const e = this.enemies[0];
      const x = this.sx(e.x), y = this.sy(e.y) - this.rpx(e.r) - 22 - Math.abs(Math.sin(t * 6)) * 8;
      ctx.font = `800 18px system-ui, sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.strokeText(tr('tapHint'), x, y);
      ctx.fillStyle = '#ffe15a';
      ctx.fillText(tr('tapHint'), x, y);
    }

    // breach marker
    if (this.breachAt) {
      const x = this.sx(this.breachAt.x), y = this.sy(this.breachAt.y);
      ctx.strokeStyle = '#ff3b4f';
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        const r = ((t * 60 + i * 25) % 75) + 10;
        ctx.globalAlpha = 1 - r / 85;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.font = `28px ${EMOJI_FONT}`;
      ctx.fillText(this.breachAt.def.emoji, x, y);
    }

    // particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      if (p.ring) {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 + (1 - p.life / p.max) * 20, 0, Math.PI * 2); ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    // floating text
    for (const f of this.floaters) {
      ctx.globalAlpha = Math.min(1, f.life * 2);
      ctx.font = `800 ${16 * f.scale}px system-ui, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    // overlays
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.freezeT > 0) {
      ctx.fillStyle = `rgba(111,211,255,${0.12 + 0.05 * Math.sin(t * 4)})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.flash})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (this.leakFlash > 0) {
      ctx.fillStyle = `rgba(255,40,60,${this.leakFlash * 0.5})`;
      ctx.fillRect(0, 0, this.w, this.h);
    }
    if (mainDanger && this.mode === 'playing') {
      const g = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.4, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,0,40,${0.18 + 0.08 * Math.sin(t * 10)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  drawEnemy(e, t) {
    const { ctx } = this;
    const x = this.sx(e.x), y = this.sy(e.y);
    const r = this.rpx(e.r);
    let alpha = 1;
    if (e.def.stealth) alpha = 0.25 + 0.75 * Math.max(0, Math.sin(e.t * 2.2 + e.seed)) ** 2;
    ctx.globalAlpha = alpha;

    if (e.near < DANGER) {
      ctx.strokeStyle = `rgba(255,60,80,${0.5 + 0.5 * Math.sin(t * 14)})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2); ctx.stroke();
    }
    if (e.def.tier === 1) { // pulsing aura so the main target is never missed
      const g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 2.2);
      g.addColorStop(0, `rgba(255,215,0,${0.35 + 0.15 * Math.sin(t * 6)})`);
      g.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(x, y + r * 0.9, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    // body
    const bob = Math.sin(e.t * 10 + e.seed) * (this.freezeT > 0 ? 0 : 2);
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.def.color;
    ctx.beginPath(); ctx.arc(x, y + bob, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();

    if (e.def.img?.complete && e.def.img.naturalWidth) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y + bob, r - 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(e.def.img, x - r, y + bob - r, r * 2, r * 2);
      ctx.restore();
    } else {
      ctx.font = `${r * 1.25}px ${EMOJI_FONT}`;
      ctx.fillText(e.def.emoji, x, y + bob + r * 0.06);
    }
    if (this.freezeT > 0) {
      ctx.fillStyle = 'rgba(160,230,255,0.45)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    // HP bar
    if (e.maxHp > 1) {
      const bw = r * 2, bh = 5;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - bw / 2, y - r - 11, bw, bh);
      ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#7cffb2' : '#ff5a5a';
      ctx.fillRect(x - bw / 2, y - r - 11, bw * (e.hp / e.maxHp), bh);
    }
    // name tag
    if (e.def.tier <= 2) {
      ctx.font = `700 ${Math.max(9, r * 0.45)}px system-ui, sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(tr(`char.${e.type}`).toUpperCase(), x, y + r + 10);
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- loop
  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.render();
    this.hooks.onHud?.(this);
    requestAnimationFrame((t) => this.loop(t));
  }
}
