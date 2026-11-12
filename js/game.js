import {
  BD, MYANMAR, INDIA, OTHER_LAND, ISLANDS, INDIA_EDGES, INDIA_LEN, DHAKA, LABELS, BBOX, pointInPoly, distToPoly,
} from './map.js';
import {
  CHARACTERS, POWERUPS, MAIN_ID, penaltyOf, isMainWave,
} from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { BASE_MODS } from './perks.js';
import { sfx, play } from './audio.js';
import { t as tr, fmt } from './i18n.js';
import { CONFIG } from './config.js';
import { getSprite, hasPose } from './assets.js';

export const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export const rand = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function weighted(pool) {
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
    this.active = true; // only the active mode's game draws and takes input (main.js)
    this.insets = { top: CONFIG.layout.hudTop, bottom: CONFIG.layout.hudBottom };
    this.reset();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    canvas.addEventListener('pointerdown', (e) => this.onPointer(e));
    this.last = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  reset() {
    if (!this.hero || !HEROES[this.hero]) this.hero = Object.keys(HEROES)[0];
    this.score = 0;
    this.wave = 0;
    this.time = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastCatch = -10;
    this.shield = 0;
    this.freezeT = 0;
    this.enemies = [];
    this.particles = [];
    this.floaters = [];
    this.kicks = []; // on-screen kick animations (screen px)
    this.fleeing = []; // caught intruders running away (screen px)
    this.quips = []; // reaction speech bubbles (screen px): { text, x, y, t, life }
    this.powerups = [];
    this.queue = [];
    this.warnings = []; // telegraphed spawns: { type, p, t }
    this.mods = { ...BASE_MODS }; // run modifiers (values in js/perks.js)
    this.lastQuipT = -10; // game time of the last new bubble (cooldown gate)
    this.spawnT = 0;
    this.breakT = 0;
    this.shake = 0;
    this.flash = 0;
    this.breachAt = null;
    this.stats = { caught: 0, taps: 0, hits: 0, closeCalls: 0, mains: 0, leaked: 0, lost: 0 };
    this.waveStats = { taps: 0, hits: 0, leaks: 0 };
    this.mainCount = 0;
    this.leakFlash = 0;
    this.lastWarnSound = -1;
  }

  // ---------------------------------------------------------------- layout
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.layout.dprCap);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;

    const top = this.insets.top;
    const bottom = this.insets.bottom;
    const mw = BBOX.maxX - BBOX.minX + CONFIG.layout.pad * 2;
    const mh = BBOX.maxY - BBOX.minY + CONFIG.layout.pad * 2;
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
    const mkMulti = (rings) => {
      const p = new Path2D();
      for (const ring of rings) {
        ring.forEach(([x, y], i) => (i ? p.lineTo : p.moveTo).call(p, this.sx(x), this.sy(y)));
        p.closePath();
      }
      return p;
    };
    this.bdPath = mk(BD);
    this.indiaPath = mkMulti(INDIA);
    this.otherPath = mkMulti(OTHER_LAND);
    this.myPath = mk(MYANMAR);
    this.islandsPath = mkMulti(ISLANDS);
    this.indiaBorder = new Path2D();
    for (const e of INDIA_EDGES) {
      this.indiaBorder.moveTo(this.sx(e.a[0]), this.sy(e.a[1]));
      this.indiaBorder.lineTo(this.sx(e.b[0]), this.sy(e.b[1]));
    }
  }

  sx(x) { return this.ox + x * this.s; }
  sy(y) { return this.oy + y * this.s; }
  rpx(r) { return Math.max(r * this.s, CONFIG.layout.minRadiusPx); }

  // ---------------------------------------------------------------- flow
  start(heroId) {
    if (heroId && HEROES[heroId]) this.hero = heroId;
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
    const count = CONFIG.waves.countBase + Math.floor(n * CONFIG.waves.countPerWave);
    // Weighting: the backbone small leaders have fixed weights; other small
    // leaders and senior leaders grow with the wave number.
    const pool = this.wavePool(n);
    const q = [];
    for (let i = 0; i < count; i++) q.push(weighted(pool));
    const main = isMainWave(n);
    if (main) q.splice(Math.floor(q.length / 2), 0, MAIN_ID);
    this.queue = q;
    this.spawnInterval = Math.max(CONFIG.waves.intervalMin, CONFIG.waves.intervalBase * Math.pow(CONFIG.waves.intervalDecay, n - 1));
    this.speedMul = Math.min(CONFIG.waves.speedMax, CONFIG.waves.speedBase + CONFIG.waves.speedPerWave * (n - 1));
    this.spawnT = CONFIG.waves.firstSpawnDelay;
    this.hooks.onBanner?.(tr('wave', { n }), main ? tr('mainIncoming') : tr('nIntruders', { n: q.length }));
    sfx.wave();
  }

  /** [id, weight] pairs of the tier 2/3 characters unlocked by wave n (CONFIG.waves). */
  wavePool(n) {
    const w = CONFIG.waves;
    return Object.entries(CHARACTERS)
      .filter(([, c]) => c.tier > 1 && n >= (c.unlock ?? 1))
      .map(([k, c]) => [k, w.poolBackbone[k] ?? (c.tier === 3 ? w.poolTier3Base + n * w.poolTier3PerWave : w.poolTier2Base + n * w.poolTier2PerWave)]);
  }

  waveCleared() {
    const n = this.wave;
    let bonus = CONFIG.scoring.clearPerWave * n;
    const acc = this.waveStats.taps ? this.waveStats.hits / this.waveStats.taps : 1;
    let sub = tr('clearBonus', { n: bonus });
    if (acc >= CONFIG.scoring.sharpshooterAccuracy) { bonus += CONFIG.scoring.sharpshooterPerWave * n; sub += ` · ${tr('sharp', { n: CONFIG.scoring.sharpshooterPerWave * n })}`; }
    if (!this.waveStats.leaks) { bonus += CONFIG.scoring.sealedPerWave * n; sub += ` · ${tr('noLeaks', { n: CONFIG.scoring.sealedPerWave * n })}`; }
    this.score += bonus;
    this.hooks.onBanner?.(tr('cleared', { n }), sub);
    sfx.cleared();
    this.breakT = CONFIG.waves.breakTime;
  }

  /** After the break between waves, the next wave starts. */
  afterBreak() { this.nextWave(); }

  /** 0..1, how much of the combo window is left (for the HUD timer). */
  comboLeft() {
    if (this.combo < 2) return 0;
    return clamp(1 - (this.time - this.lastCatch) / this.mods.comboWindow, 0, 1);
  }

  // ---------------------------------------------------------------- spawning
  spawnPoint() {
    const v = this.view;
    const m = CONFIG.spawn.viewMargin;
    for (let tries = 0; tries < CONFIG.spawn.tries; tries++) {
      let r = Math.random() * INDIA_LEN;
      let edge = INDIA_EDGES[0];
      for (const e of INDIA_EDGES) { if ((r -= e.len) <= 0) { edge = e; break; } }
      const t = Math.random();
      const px = edge.a[0] + (edge.b[0] - edge.a[0]) * t;
      const py = edge.a[1] + (edge.b[1] - edge.a[1]) * t;
      let nx = -(edge.b[1] - edge.a[1]) / edge.len;
      let ny = (edge.b[0] - edge.a[0]) / edge.len;
      if (pointInPoly(BD, px + nx * CONFIG.spawn.normalProbe, py + ny * CONFIG.spawn.normalProbe)) { nx = -nx; ny = -ny; }
      const d = rand(CONFIG.spawn.min, CONFIG.spawn.max);
      const x = clamp(px + nx * d, v.minX + m, v.maxX - m);
      const y = clamp(py + ny * d, v.minY + m, v.maxY - m);
      if (pointInPoly(BD, x, y)) continue;
      if (!INDIA.some((ring) => pointInPoly(ring, x, y))) continue;
      if (distToPoly(BD, x, y) < CONFIG.spawn.minBorderDist) continue;
      return { x, y, tx: px - nx * CONFIG.spawn.targetInset, ty: py - ny * CONFIG.spawn.targetInset };
    }
    return null;
  }

  /** Pick a spawn point now and show a warning there; the intruder appears later. */
  warn(type) {
    const p = this.spawnPoint();
    if (!p) return;
    this.warnings.push({ type, p, t: CONFIG.spawn.warnTime });
    // Rate-limited spawn-warning sound (at most one per warnThrottle seconds).
    if (this.time - this.lastWarnSound >= CONFIG.waves.warnThrottle) {
      this.lastWarnSound = this.time;
      sfx.warn();
    }
  }

  /**
   * `primary` = a normal wave spawn at a border spawn point (gets the fairness speed
   * scaling and spawns its whole pack). Summons/splits pass `at` without `primary`.
   */
  spawn(type, at = null, primary = !at) {
    const def = CHARACTERS[type];
    const p = at || this.spawnPoint();
    if (!p) return;
    // On narrow screens a spawn can be clamped close to the border. Scale speed so the
    // time-to-border stays about the same as on a large screen (fair on phones).
    let fair = 1;
    if (primary) fair = clamp(Math.hypot(p.tx - p.x, p.ty - p.y) / ((CONFIG.spawn.min + CONFIG.spawn.max) / 2), CONFIG.spawn.fairnessMin, CONFIG.spawn.fairnessMax);
    const e = {
      type, def,
      x: p.x, y: p.y, tx: p.tx, ty: p.ty, phase: 0,
      hp: def.hp, maxHp: def.hp, r: def.radius,
      speed: def.speed * this.speedMul * fair * rand(CONFIG.spawn.speedJitterMin, CONFIG.spawn.speedJitterMax),
      t: 0, seed: Math.random() * 10, hitFlash: 0, hop: 0, summonT: def.summons?.every ?? 0,
      home: { x: p.x, y: p.y }, facing: 1,
    };
    if (def.tier === 1) {
      e.hp = e.maxHp = def.hp + this.mainCount * CONFIG.waves.mainHpPerAppearance; // tougher every appearance
      this.mainCount++;
      sfx.boss();
      navigator.vibrate?.(80);
    }
    this.enemies.push(e);
    // packs: spawn the rest of the group next to the first one
    if (primary && def.group > 1) {
      for (let i = 1; i < def.group; i++) {
        const a = Math.random() * Math.PI * 2;
        this.spawn(type, {
          x: p.x + Math.cos(a) * CONFIG.spawn.packSpread, y: p.y + Math.sin(a) * CONFIG.spawn.packSpread,
          tx: p.tx + rand(-CONFIG.spawn.packTargetJitter, CONFIG.spawn.packTargetJitter), ty: p.ty + rand(-CONFIG.spawn.packTargetJitter, CONFIG.spawn.packTargetJitter),
        });
      }
    }
  }

  // ---------------------------------------------------------------- input
  onPointer(ev) {
    if (!this.active || this.mode !== 'playing') return;
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left;
    const py = ev.clientY - rect.top;

    // power-ups first
    for (const pu of this.powerups) {
      if (Math.hypot(this.sx(pu.x) - px, this.sy(pu.y) - py) < CONFIG.input.powerupTapRadiusPx) {
        this.collect(pu);
        return;
      }
    }

    this.stats.taps++; this.waveStats.taps++;
    let best = null; let bestD = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(this.sx(e.x) - px, this.sy(e.y) - py);
      const hitR = Math.max(this.rpx(e.r) * CONFIG.input.hitRadiusMultiplier, CONFIG.input.minHitRadiusPx) * this.mods.tapRadius;
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

  damage(e, amount, heroId = null) {
    e.hp -= amount;
    e.hitFlash = CONFIG.combat.hitFlashTime;
    if (e.hp > 0) {
      sfx.hit();
      // knock back away from the border
      const dx = e.x - e.tx, dy = e.y - e.ty;
      const d = Math.hypot(dx, dy) || 1;
      const kb = CONFIG.combat.knockback * this.mods.knockback;
      e.x += (dx / d) * kb; e.y += (dy / d) * kb;
      if (e.def.dash) { // jump sideways, so the next tap has to chase it
        const side = Math.random() < 0.5 ? -1 : 1;
        e.x += (-dy / d) * CONFIG.combat.dash * side; e.y += (dx / d) * CONFIG.combat.dash * side;
        if (pointInPoly(BD, e.x, e.y)) { e.x -= (-dy / d) * CONFIG.combat.dash * 2 * side; e.y -= (dx / d) * CONFIG.combat.dash * 2 * side; }
      }
      this.spawnKick(e, heroId);
      e.hop = 1; // little hop while being kicked back
      this.burst(e.x, e.y, e.def.color, 6);
      return;
    }
    this.catch(e, heroId);
  }

  catch(e, heroId = null) {
    this.spawnKick(e, heroId);
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.spawnFleeing(e);
    const oldMult = this.multiplier();
    if (this.time - this.lastCatch < this.mods.comboWindow) this.combo++; else this.combo = 1;
    this.lastCatch = this.time;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const mult = this.multiplier();
    let pts = e.def.points * mult;
    const near = distToPoly(BD, e.x, e.y);
    let label = `+${fmt(pts)}`;
    const closeCall = near < CONFIG.scoring.closeCallDistance;
    if (closeCall) {
      pts += CONFIG.scoring.closeCallBonus; this.stats.closeCalls++; label = `+${fmt(pts)} ${tr('closeCall')}`;
    }
    const isMain = e.def.tier === 1;
    if (isMain) this.stats.mains++;
    this.score += pts;
    this.stats.caught++;
    this.floater(this.sx(e.x), this.sy(e.y) - 20, label, mult > 1 ? '#ffe15a' : '#ffffff', isMain ? 1.6 : 1);
    this.burst(e.x, e.y, e.def.color, isMain ? 40 : 14);
    if (e.def.sound) play(e.def.sound, this.combo); else play('catch', this.combo);
    if (mult > oldMult) sfx.combo();
    if (closeCall) sfx.close();
    if (isMain) { this.shake = 0.4; navigator.vibrate?.([40, 30, 40]); }
    if (Math.random() < (isMain ? 1 : CONFIG.powerups.dropChance + this.mods.dropBonus)) this.dropPowerup(e.x, e.y);
    if (e.def.splits) this.split(e);
    this.quip(e); // "Ouch!" — the caught one gets a word (CONFIG.fun)
  }

  /** Splitters break into smaller intruders, pushed back a little from the border. */
  split(e) {
    const { into, n } = e.def.splits;
    const kinds = Array.isArray(into) ? into : [into];
    const dx = e.x - e.tx, dy = e.y - e.ty;
    const d = Math.hypot(dx, dy) || 1;
    for (let i = 0; i < n; i++) {
      const side = (i - (n - 1) / 2) * CONFIG.combat.splitterSpacing;
      const x = e.x + (dx / d) * CONFIG.combat.splitterPush + (-dy / d) * side;
      const y = e.y + (dy / d) * CONFIG.combat.splitterPush + (dx / d) * side;
      if (pointInPoly(BD, x, y)) continue;
      this.spawn(kinds[Math.floor(Math.random() * kinds.length)], { x, y, tx: e.tx + (-dy / d) * side, ty: e.ty + (dx / d) * side });
    }
  }

  // Flee direction (normalised screen vector: from border target out to spawn home)
  fleeVector(e) {
    const hx = e.home?.x ?? e.x, hy = e.home?.y ?? e.y;
    let dx = hx - e.tx, dy = hy - e.ty;
    let len = Math.hypot(dx, dy);
    if (!len || len < 1e-6) { dx = e.x - e.tx; dy = e.y - e.ty; len = Math.hypot(dx, dy); }
    if (!len) return { x: 0, y: -1 };
    return { x: dx / len, y: dy / len };
  }

  /** Hero pops up behind the intruder and kicks it; plays the hero's kick sound. */
  spawnKick(e, heroId) {
    const hero = heroId && HEROES[heroId] ? heroId : this.hero;
    const dir = this.fleeVector(e);
    const dist = this.rpx(e.r) + CONFIG.kick.heroOffsetPx;
    this.kicks.push({
      hero,
      x: this.sx(e.x) - dir.x * dist,
      y: this.sy(e.y) - dir.y * dist,
      dirX: dir.x, dirY: dir.y,
      t: 0, life: CONFIG.kick.heroShowTime,
    });
    this.burst(e.x, e.y, '#ffe15a', 8);
    play(HEROES[hero].sound || 'kick');
  }

  /** Caught intruder runs back towards India (screen px) and fades away. */
  spawnFleeing(e) {
    const dir = this.fleeVector(e);
    this.fleeing.push({
      def: e.def, type: e.type,
      x: this.sx(e.x), y: this.sy(e.y),
      vx: dir.x * CONFIG.kick.fleeSpeedPx, vy: dir.y * CONFIG.kick.fleeSpeedPx,
      traveled: 0, spin: Math.random() * Math.PI * 2,
    });
  }

  multiplier() { return Math.min(CONFIG.scoring.multiplierMax, 1 + Math.floor((this.combo - 1) / CONFIG.scoring.multiplierStep)); }

  dropPowerup(x, y) {
    const kinds = this.powerupKinds().filter((k) => k !== 'shield' || this.shield < CONFIG.powerups.maxShield);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.powerups.push({ kind, x, y, t: 0, life: CONFIG.powerups.life });
  }

  /** Power-up kinds this mode can drop (overridden by other modes). */
  powerupKinds() { return Object.keys(POWERUPS); }

  collect(pu) {
    this.powerups.splice(this.powerups.indexOf(pu), 1);
    const def = POWERUPS[pu.kind];
    if (pu.kind === 'freeze') this.freezeT = this.mods.freezeTime;
    if (pu.kind === 'shield') this.shield = Math.min(CONFIG.powerups.maxShield, this.shield + 1);
    this.floater(this.sx(pu.x), this.sy(pu.y) - 24, tr(`pu.${pu.kind}`), def.color, 1.2);
    this.burst(pu.x, pu.y, def.color, 16);
    if (pu.kind === 'freeze') sfx.freeze();
    else if (pu.kind === 'shield') sfx.shield();
    else sfx.power();
  }

  breach(e) {
    // Tier 2 / 3: they get in, you lose points, the game goes on.
    if (e.def.tier > 1) {
      this.enemies.splice(this.enemies.indexOf(e), 1);
      const lost = Math.min(penaltyOf(e.def), this.score);
      this.score -= lost;
      this.stats.leaked++; this.stats.lost += lost; this.waveStats.leaks++;
      this.combo = 0;
      this.leakFlash = 0.35;
      this.shake = Math.max(this.shake, e.def.tier === 2 ? 0.3 : 0.15);
      sfx.leak();
      navigator.vibrate?.(50);
      this.floater(this.sx(e.x), this.sy(e.y) - 20, lost ? `−${fmt(lost)} ${this.leakLabel()}` : this.leakLabel(), '#ff5a6a', e.def.tier === 2 ? 1.3 : 1);
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

  leakLabel() { return tr('leaked'); }

  summary() {
    return {
      score: this.score, wave: this.wave, bestCombo: this.bestCombo, ...this.stats,
      accuracy: this.stats.taps ? Math.round((this.stats.hits / this.stats.taps) * 100) : 0,
      intruderType: this.breachAt?.type ?? '',
    };
  }

  // ---------------------------------------------------------------- update
  update(dt) {
    this.updateEffects(dt);
    if (this.mode !== 'playing') return;
    this.updatePlay(dt);
  }

  /** Cosmetic timers, particles, kicks and fleeing intruders (all modes). */
  updateEffects(dt) {
    this.shake = Math.max(0, this.shake - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.leakFlash = Math.max(0, this.leakFlash - dt);
    for (const p of this.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const f of this.floaters) { f.y -= 40 * dt; f.life -= dt; }
    this.floaters = this.floaters.filter((f) => f.life > 0);

    // Reaction bubbles age and drift up in every mode (like particles).
    for (const q of this.quips) { q.t += dt; q.y -= 20 * dt; }
    this.quips = this.quips.filter((q) => q.t < q.life);

    // Kick visuals and fleeing intruders: animate even when not playing (like
    // particles), but freeze while the pause screen is open.
    if (this.mode !== 'paused') {
      for (const k of this.kicks) k.t += dt;
      this.kicks = this.kicks.filter((k) => k.t < k.life);
      for (const f of this.fleeing) {
        f.x += f.vx * dt; f.y += f.vy * dt;
        f.traveled += Math.hypot(f.vx, f.vy) * dt;
      }
      this.fleeing = this.fleeing.filter((f) => f.traveled < CONFIG.kick.fleeDistancePx);
    }
  }

  updatePlay(dt) {
    this.time += dt;
    this.freezeT = Math.max(0, this.freezeT - dt);
    if (this.time - this.lastCatch > this.mods.comboWindow) this.combo = 0;

    // waves
    if (this.breakT > 0) {
      this.breakT -= dt;
      if (this.breakT <= 0) this.afterBreak();
    } else if (this.queue.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.warn(this.queue.shift());
        if (this.wave >= CONFIG.waves.doubleFromWave && this.queue.length && Math.random() < CONFIG.waves.doubleChance) this.warn(this.queue.shift());
        this.spawnT = this.spawnInterval * rand(CONFIG.waves.jitterMin, CONFIG.waves.jitterMax);
      }
    } else if (!this.enemies.length && !this.warnings.length) {
      this.waveCleared();
    }

    // telegraphed spawns become intruders
    for (const w of [...this.warnings]) {
      w.t -= dt;
      if (w.t <= 0) { this.warnings.splice(this.warnings.indexOf(w), 1); this.spawn(w.type, w.p, true); }
    }

    // power-ups expire
    for (const pu of this.powerups) pu.t += dt;
    this.powerups = this.powerups.filter((pu) => pu.t < pu.life);

    // intruders
    const frozen = this.freezeT > 0;
    for (const e of [...this.enemies]) {
      e.t += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.hop > 0) e.hop = Math.max(0, e.hop - dt / 0.25);
      if (frozen) continue;
      const tx = e.phase === 0 ? e.tx : DHAKA[0];
      const ty = e.phase === 0 ? e.ty : DHAKA[1];
      const dx = tx - e.x, dy = ty - e.y;
      const d = Math.hypot(dx, dy) || 1;
      if (e.phase === 0 && d < CONFIG.combat.phaseSwitchDistance) e.phase = 1;
      const spd = e.speed;
      let vx = (dx / d) * spd, vy = (dy / d) * spd;
      if (e.def.wobble) {
        const w = Math.sin(e.t * CONFIG.combat.wobbleFrequency + e.seed) * spd * CONFIG.combat.wobbleAmplitude;
        vx += (-dy / d) * w; vy += (dx / d) * w;
      }
      e.x += vx * dt; e.y += vy * dt;
      if (Math.abs(vx) > 0.01) e.facing = vx < 0 ? -1 : 1;
      e.near = distToPoly(BD, e.x, e.y);
      if (e.def.summons) {
        e.summonT -= dt;
        if (e.summonT <= 0) {
          e.summonT = Math.max(CONFIG.spawn.summonMinInterval, e.def.summons.every - this.wave * CONFIG.spawn.summonSpeedupPerWave);
          const kinds = e.def.summons.types;
          const a = Math.random() * Math.PI * 2;
          this.spawn(kinds[Math.floor(Math.random() * kinds.length)], {
            x: e.x + Math.cos(a) * CONFIG.spawn.summonSpread, y: e.y + Math.sin(a) * CONFIG.spawn.summonSpread, tx: e.tx + rand(-CONFIG.spawn.summonSpread, CONFIG.spawn.summonSpread), ty: e.ty + rand(-CONFIG.spawn.summonSpread, CONFIG.spawn.summonSpread),
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

  /**
   * A caught character complains in a little speech bubble just above its
   * head. Chances and timing come from CONFIG.fun; tier 1 (Hasina) uses the
   * `quipsMain` lines. `force` skips both the chance and the cooldown.
   */
  quip(e, force = false) {
    const F = CONFIG.fun;
    if (!force) {
      if (this.time - this.lastQuipT < F.quipCooldown) return;
      if (Math.random() >= (e.def.tier === 1 ? F.mainQuipChance : F.quipChance)) return;
    }
    this.lastQuipT = this.time;
    const lines = tr(e.def.tier === 1 ? 'quipsMain' : 'quips');
    if (!Array.isArray(lines) || !lines.length) return;
    const r = this.rpx(e.def.radius ?? 0.1);
    // Tail tip sits a little above the sprite's head (kept below the HUD).
    const y = Math.max(this.sy(e.y) - r * CONFIG.sprites.heightMul - 4, this.insets.top + 16);
    this.quips.push({ text: lines[Math.floor(Math.random() * lines.length)], x: this.sx(e.x), y, t: 0, life: F.quipTime });
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

    // sea (full-canvas background)
    const sea = ctx.createLinearGradient(0, 0, 0, this.h);
    sea.addColorStop(0, '#12476b');
    sea.addColorStop(1, '#0a2a44');
    ctx.fillStyle = sea;
    ctx.fillRect(-20, -20, this.w + 40, this.h + 40);
    // neighbour land. Each country is simplified on its own, so shared borders leave
    // hairline gaps; stroking every shape in its own colour closes them.
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    for (const [path, color] of [[this.indiaPath, '#2b2633'], [this.otherPath, '#2f2a36'], [this.myPath, '#332d3c']]) {
      ctx.fillStyle = color; ctx.strokeStyle = color;
      ctx.fill(path); ctx.stroke(path);
    }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.stroke(this.indiaPath);
    ctx.stroke(this.myPath);

    // labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.max(10, this.s * 0.11)}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (const l of LABELS) ctx.fillText(tr(`map.${l.key}`), this.sx(l.at[0]), this.sy(l.at[1]));

    // Bangladesh
    ctx.save();
    ctx.fillStyle = '#0f6a45';
    ctx.fill(this.bdPath);
    ctx.fill(this.islandsPath);
    ctx.clip(this.bdPath);
    ctx.fillStyle = 'rgba(218,26,52,0.82)';
    ctx.beginPath();
    ctx.arc(this.sx(DHAKA[0] - 0.15), this.sy(DHAKA[1]), this.s * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke(this.islandsPath);

    // border
    const danger = this.enemies.some((e) => e.near < CONFIG.combat.dangerDistance);
    const mainDanger = this.enemies.some((e) => e.def.tier === 1 && e.near < CONFIG.combat.dangerDistance * 2);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke(this.bdPath);
    ctx.lineWidth = 3;
    ctx.strokeStyle = danger ? `rgba(255,${80 + 60 * Math.sin(t * 12)},80,1)` : '#7cffb2';
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
    ctx.fillText(tr('map.dhaka'), this.sx(DHAKA[0]), this.sy(DHAKA[1]) + Math.max(12, this.s * 0.1));

    // power-ups
    for (const pu of this.powerups) {
      const x = this.sx(pu.x), y = this.sy(pu.y);
      const fade = pu.life - pu.t < CONFIG.powerups.blinkTime ? (Math.sin(t * 20) > 0 ? 1 : 0.3) : 1;
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

    // spawn warnings
    for (const w of this.warnings) this.drawWarning(w, t);

    // fleeing intruders (before live enemies)
    for (const f of this.fleeing) this.drawFleeing(f, t);

    // intruders
    for (const e of this.enemies) this.drawEnemy(e, t);

    // kicks (hero pops up behind the intruder, on top)
    for (const k of this.kicks) this.drawKick(k);
    this.drawLayer(t);
    this.drawHint(t);

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

    // reaction speech bubbles (before the full-screen overlays)
    this.drawQuips();

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
    this.drawBossBar();
    if (mainDanger && this.mode === 'playing') {
      const g = ctx.createRadialGradient(this.w / 2, this.h / 2, Math.min(this.w, this.h) * 0.4, this.w / 2, this.h / 2, Math.max(this.w, this.h) * 0.75);
      g.addColorStop(0, 'rgba(255,0,0,0)');
      g.addColorStop(1, `rgba(255,0,40,${0.18 + 0.08 * Math.sin(t * 10)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  /** Extra mode-specific drawing on top of the characters (other modes override). */
  drawLayer() {}

  /** First-run hint over the first intruder. */
  drawHint(t) {
    if (this.mode !== 'playing' || this.stats.caught !== 0 || !this.enemies.length) return;
    const e = this.enemies[0];
    this.hintText(tr('tapHint'), this.sx(e.x), this.sy(e.y) - this.rpx(e.r) - 22 - Math.abs(Math.sin(t * 6)) * 8);
  }

  hintText(text, x, y) {
    const { ctx } = this;
    ctx.font = `800 18px system-ui, sans-serif`;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffe15a';
    ctx.fillText(text, x, y);
  }

  /**
   * Reaction speech bubbles: a white rounded bubble with a small tail
   * pointing down at the speaker. Pops in over 0.1 s, fades out over the
   * last 0.25 s of its life.
   */
  drawQuips() {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 13px system-ui, sans-serif';
    for (const q of this.quips) {
      const grow = Math.min(1, q.t / 0.1);
      const fade = clamp((q.life - q.t) / 0.25, 0, 1);
      const scale = 0.6 + 0.4 * grow;
      const bw = ctx.measureText(q.text).width + 16;
      const bh = 24;
      const x = clamp(q.x, bw / 2 + 4, this.w - bw / 2 - 4); // keep it on screen
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x, q.y); // (x, y) = tip of the tail, under the bubble
      ctx.scale(scale, scale);
      ctx.beginPath();
      ctx.moveTo(-bw / 2 + 7, -bh);
      ctx.arcTo(bw / 2, -bh, bw / 2, 0, 7);
      ctx.arcTo(bw / 2, 0, -bw / 2, 0, 7);
      ctx.arcTo(-bw / 2, 0, -bw / 2, -bh, 7);
      ctx.arcTo(-bw / 2, -bh, bw / 2, -bh, 7);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath(); // tail
      ctx.moveTo(-5, -2);
      ctx.lineTo(5, -2);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1c1f24';
      ctx.fillText(q.text, 0, -bh / 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawWarning(w, t) {
    const { ctx } = this;
    const x = this.sx(w.p.x), y = this.sy(w.p.y);
    const main = CHARACTERS[w.type].tier === 1;
    const k = 1 - w.t / CONFIG.spawn.warnTime; // 0 → 1 as the spawn approaches
    const color = main ? '255,215,0' : '255,90,106';
    const r = (main ? 34 : 22) * (1.4 - 0.6 * k);
    ctx.globalAlpha = 0.35 + 0.5 * k;
    ctx.strokeStyle = `rgb(${color})`;
    ctx.lineWidth = main ? 4 : 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.arc(x, y, r, t * 3, t * 3 + Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `900 ${main ? 22 : 16}px system-ui, sans-serif`;
    ctx.fillStyle = `rgb(${color})`;
    ctx.fillText(main ? CHARACTERS[w.type].emoji : '!', x, y);
    ctx.globalAlpha = 1;
  }

  /** Big HP bar for the main target, just under the HUD. */
  drawBossBar() {
    const boss = this.enemies.find((e) => e.def.tier === 1);
    if (!boss || this.mode === 'menu') return;
    const { ctx } = this;
    const bw = Math.min(360, this.w - 40), bh = 12;
    const x = (this.w - bw) / 2, y = this.insets.top + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 2, y - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(x, y, bw * Math.max(0, boss.hp / boss.maxHp), bh);
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillStyle = '#000';
    ctx.fillText(`${boss.def.emoji} ${tr(`char.${boss.type}`)} · ${fmt(Math.max(0, boss.hp))}/${fmt(boss.maxHp)}`, this.w / 2, y + bh / 2 + 1);
  }

  /** Opacity of a character (stealth ones fade in and out). */
  stealthAlpha(e) {
    return e.def.stealth ? 0.25 + 0.75 * Math.max(0, Math.sin(e.t * 2.2 + e.seed)) ** 2 : 1;
  }

  drawEnemy(e, t) {
    const { ctx } = this;
    const x = this.sx(e.x), y = this.sy(e.y) - (e.hop > 0 ? Math.sin((1 - e.hop) * Math.PI) * CONFIG.kick.fleeHopPx * 0.5 : 0);
    const r = this.rpx(e.r);
    ctx.globalAlpha = this.stealthAlpha(e);

    if (e.near < CONFIG.combat.dangerDistance) {
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
    const bob = Math.sin(e.t * 10 + e.seed) * (this.freezeT > 0 ? 0 : 2);
    const frozen = this.freezeT > 0;
    // Frozen uses the idle pose (getSprite falls back to walk).
    const pose = e.pose ?? (frozen ? 'idle' : 'walk');
    const sprite = getSprite(e.def, pose);

    if (sprite) {
      // Full-body, feet-anchored, no coloured circle. Art faces right.
      const S = CONFIG.sprites;
      const h = r * S.heightMul;
      const feetY = y + bob + r * S.feetOffset;
      ctx.save();
      ctx.translate(x, feetY);
      if ((e.facing ?? 1) < 0) ctx.scale(-1, 1);
      if (pose === 'kicked' && !hasPose(e.def, 'kicked')) {
        // One image per character: fake the kicked pose with a backward lean + squash.
        ctx.rotate(-18 * Math.PI / 180);
        ctx.scale(1.06, 0.92);
      } else if (pose === 'walk') {
        ctx.rotate(Math.sin(e.t * 8 + e.seed) * 4 * Math.PI / 180); // gentle waddle
      }
      if (e.hitFlash > 0 && 'filter' in ctx) ctx.filter = 'brightness(2.2)';
      ctx.drawImage(sprite, -h / 2, -h, h, h);
      if ('filter' in ctx) ctx.filter = 'none';
      ctx.restore();
      if (frozen) {
        ctx.fillStyle = 'rgba(160,230,255,0.45)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
      // HP bar above the sprite top.
      if (e.maxHp > 1) {
        const bw = r * 2, bh = 5;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - bw / 2, feetY - h - 11, bw, bh);
        ctx.fillStyle = e.hp / e.maxHp > 0.4 ? '#7cffb2' : '#ff5a5a';
        ctx.fillRect(x - bw / 2, feetY - h - 11, bw * (e.hp / e.maxHp), bh);
      }
      // Name tag below the feet.
      if (e.def.tier <= 2) {
        ctx.font = `700 ${Math.max(9, r * 0.45)}px system-ui, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.fillText(tr(`char.${e.type}`).toUpperCase(), x, feetY + 10);
      }
      ctx.globalAlpha = 1;
      return;
    }

    // No sprite: coloured circle + emoji, exactly as before.
    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : e.def.color;
    ctx.beginPath(); ctx.arc(x, y + bob, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.stroke();
    ctx.font = `${r * 1.25}px ${EMOJI_FONT}`;
    ctx.fillText(e.def.emoji, x, y + bob + r * 0.06);
    if (frozen) {
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

  /** Hero pops up behind the intruder (screen px): ready pose, then kick. */
  drawKick(k) {
    const { ctx } = this;
    const def = HEROES[k.hero] || HEROES[Object.keys(HEROES)[0]];
    const K = CONFIG.kick;
    const life = k.life;
    const t = Math.min(k.t, life);
    const alpha = t < life * 0.7 ? 1 : Math.max(0, 1 - (t - life * 0.7) / (life * 0.3));
    const pop = 0.6 + 0.4 * Math.min(1, k.t / 0.08);
    const size = K.heroSizePx * pop;
    const winding = k.t < K.windupTime;
    const kickArt = hasPose(def, 'kick');
    const fakeKick = !winding && !kickArt; // one image per hero: fake it with the ready pose
    const pose = winding || !kickArt ? 'ready' : 'kick';
    const sprite = getSprite(def, pose);
    const cx = k.x + k.dirX * size * 0.55;
    const cy = k.y + k.dirY * size * 0.55;

    ctx.globalAlpha = alpha;
    ctx.save();
    ctx.translate(k.x, k.y);
    if (fakeKick) ctx.translate(k.dirX * size * 0.18, k.dirY * size * 0.18); // lunge at the intruder
    if (sprite) {
      if (k.dirX < 0) ctx.scale(-1, 1); // sprites face right
      if (fakeKick) ctx.rotate(14 * Math.PI / 180); // lean into the kick
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      const r = size / 2;
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
      ctx.font = `${r * 1.3}px ${EMOJI_FONT}`;
      ctx.fillText(def.emoji, 0, 0);
      // foot emoji swings from behind to the front during the kick
      const p = winding ? 0 : Math.min(1, (k.t - K.windupTime) / Math.max(0.0001, life - K.windupTime));
      const off = (p * 2 - 1) * size * 0.62;
      ctx.font = `${size * 0.52}px ${EMOJI_FONT}`;
      ctx.fillText('🦶', k.dirX * off, k.dirY * off);
    }
    ctx.restore();

    // impact lines at the contact point (once the foot lands)
    if (!winding && alpha > 0) {
      const base = Math.atan2(k.dirY, k.dirX);
      ctx.strokeStyle = '#ffe15a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        const ang = base + (i - 1.5) * 0.45;
        const len = size * 0.28;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * size * 0.22, cy + Math.sin(ang) * size * 0.22);
        ctx.lineTo(cx + Math.cos(ang) * (size * 0.22 + len), cy + Math.sin(ang) * (size * 0.22 + len));
        ctx.stroke();
      }
      if (fakeKick) { // no kick art: a small bang where the foot lands
        ctx.font = `${Math.round(size * 0.5)}px ${EMOJI_FONT}`;
        ctx.fillText('💥', cx, cy);
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Caught intruder running back towards India (screen px), fading away. */
  drawFleeing(f, t) {
    const { ctx } = this;
    const K = CONFIG.kick;
    const def = f.def;
    const r = this.rpx(def.radius);
    const alpha = K.fleeFade ? Math.max(0, 1 - f.traveled / K.fleeDistancePx) : 1;
    const hopT = Math.min(1, f.traveled / (K.fleeSpeedPx * 0.25));
    const hop = hopT < 1 ? Math.sin(hopT * Math.PI) * K.fleeHopPx : 0;
    const tilt = Math.sin(f.traveled * 0.05 + f.spin) * K.fleeWobbleDeg * Math.PI / 180;
    const kickedArt = hasPose(def, 'kicked');
    const sprite = getSprite(def, 'kicked');

    ctx.globalAlpha = alpha;
    if (def.tier === 1) { // gold aura kept while fleeing
      const g = ctx.createRadialGradient(f.x, f.y - hop, r * 0.8, f.x, f.y - hop, r * 2.2);
      g.addColorStop(0, `rgba(255,215,0,${0.35 + 0.15 * Math.sin(t * 6)})`);
      g.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(f.x, f.y - hop, r * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(f.x, f.y - hop + r * 0.9, r * 0.8, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(f.x, f.y - hop);
    ctx.rotate(tilt);
    if (f.vx < 0) ctx.scale(-1, 1); // mirrored when moving left
    if (sprite) {
      // Full-body, feet-anchored, no coloured circle (kicked pose).
      const S = CONFIG.sprites;
      const h = r * S.heightMul;
      if (!kickedArt) {
        // One image per character: fake the kicked pose with a backward lean + squash.
        ctx.rotate(-18 * Math.PI / 180);
        ctx.scale(1.06, 0.92);
      }
      ctx.drawImage(sprite, -h / 2, r * S.feetOffset - h, h, h);
    } else {
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();
      ctx.font = `${r * 1.25}px ${EMOJI_FONT}`;
      ctx.fillText(def.emoji, 0, 0);
    }
    ctx.restore();

    // dust puffs behind
    ctx.font = `${r * 0.75}px ${EMOJI_FONT}`;
    ctx.fillText('💨', f.x - f.vx * 0.045, f.y - f.vy * 0.045 - hop * 0.5);
    ctx.fillText('💨', f.x - f.vx * 0.099, f.y - f.vy * 0.099 - hop * 0.4);
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- loop
  loop(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (this.active) {
      this.update(dt);
      this.render();
      this.hooks.onHud?.(this);
    }
    requestAnimationFrame((t) => this.loop(t));
  }
}
