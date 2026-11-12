// "Rope 'Em!" mode, design v2 (docs/PLAN-lasso.md): the crooks lurk on Indian
// land around Bangladesh and every now and then one sneaks across the border
// and runs for Dhaka. The hero circles the jail at Dhaka, throws a rope at
// taps (running over first when the target is out of reach) and flings caught
// crooks into the jail. Locking up Hasina wins the game. Tunables: CONFIG.lasso.
import { Game, rand, clamp, weighted, EMOJI_FONT } from './game.js';
import { BD, INDIA, DHAKA, pointInPoly, distToPoly } from './map.js';
import { CHARACTERS, MAIN_ID } from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { sfx, play } from './audio.js';
import { t as tr, fmt } from './i18n.js';
import { CONFIG } from './config.js';
import { getSprite, hasAsset, hasPose } from './assets.js';

const L = CONFIG.lasso;

const inside = (x, y) => pointInPoly(BD, x, y);

// Cosmetic effect values only (rendering/particles), not gameplay tunables.
const FX = {
  leakFlash: 0.35, // s, red flash when a crook gets in
  shakeLeak: 0.3, // screen shake when a crook gets in
  shieldFlash: 0.3, // white flash when the shield blocks a get-in
  shieldShake: 0.5, // screen shake when the shield blocks a get-in
  jailShake: 0.2, // s, the jail rattles after a delivery
  jailShakePx: 2.5, // px, jail rattle amplitude
  hopFade: 0.25, // s, dodge-hop length (same as game.js)
  dustEvery: 0.12, // s, dust puffs behind the running hero
  spinSpeed: 9, // rad/s, spin of a crook flying into the jail
};

/** Rounded-rect path (ctx.roundRect is not universal). */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class LassoGame extends Game {
  reset() {
    super.reset();
    this.level = 1;
    this.locked = 0; // crooks delivered to the jail
    this.jail = []; // prisoner types, newest last
    this.lives = L.lives;
    this.maxLives = L.lives;
    this.won = false;
    this.reason = '';
    this.rope = null;
    this.yanks = []; // crooks flying into the jail: { def, type, x0, y0, t }
    this.jailShakeT = 0;
    // hero
    this.heroA = 0; // orbit angle around Dhaka
    this.heroDir = 1;
    this.heroFacing = 1;
    this.hx = DHAKA[0] + L.orbitRadius; // hero position in map units
    this.hy = DHAKA[1];
    this.heroState = 'orbit'; // 'orbit' | 'chase' | 'return'
    this.chaseTarget = null; // a crook object, or a fixed { x, y } point
    this.cheerT = 0;
    this.dustT = 0;
    // timers
    this.spawnInterval = L.spawnEvery;
    this.sneakT = L.sneakEvery;
    this.mainAt = null; // s until Hasina is telegraphed (null = unscheduled)
    this.mainT = 0; // s Hasina has been on the map
    this.mainCooldownT = 0; // s before she can come back
  }

  powerupKinds() { return L.powerups; }

  /** Called once by Game.start(); "waves" are levels here and advance on lockups. */
  nextWave() {
    this.wave = this.level;
    this.waveStats = { taps: 0, hits: 0, leaks: 0 };
    this.spawnInterval = Math.max(L.spawnEveryMin, L.spawnEvery * Math.pow(L.spawnSpeedup, this.level - 1));
    this.spawnT = L.firstSpawnDelay;
    this.sneakT = this.sneakInterval();
    this.hooks.onBanner?.(tr('lLevelUp', { n: this.level }), tr('lHint'));
  }

  gameOver(reason) {
    this.reason = reason;
    this.rope = null;
    this.mode = 'over';
    this.shake = 0.6;
    sfx.over();
    navigator.vibrate?.([200, 80, 200]);
    setTimeout(() => this.hooks.onGameOver?.(this.summary()), 1100);
  }

  summary() {
    return {
      ...super.summary(), mode: 'lasso', won: this.won, level: this.level,
      locked: this.locked, lives: this.lives, reason: this.reason,
      time: Math.round(this.time), wave: this.level, // `wave` feeds the best-score save
    };
  }

  // ---------------------------------------------------------------- lurk ground
  /** Valid lurker ground: Indian land, outside Bangladesh, near enough to the border. */
  lurkOK(x, y) {
    return !inside(x, y) && distToPoly(BD, x, y) <= L.lurkMaxBorderDist
      && INDIA.some((ring) => pointInPoly(ring, x, y));
  }

  /**
   * A random lurk point: inside an India ring and outside BD,
   * `lurkMin..MaxBorderDist` from the border, on screen; within `maxDist`
   * of `near` when given. Null after ~60 failed tries.
   */
  lurkPoint(near = null, maxDist = 0) {
    const v = this.view;
    const m = CONFIG.spawn.viewMargin;
    for (let tries = 0; tries < 60; tries++) {
      const x = near ? near.x + rand(-maxDist, maxDist) : rand(v.minX + m, v.maxX - m);
      const y = near ? near.y + rand(-maxDist, maxDist) : rand(v.minY + m, v.maxY - m);
      if (x < v.minX + m || x > v.maxX - m || y < v.minY + m || y > v.maxY - m) continue;
      if (!this.lurkOK(x, y)) continue;
      const d = distToPoly(BD, x, y);
      if (d < L.lurkMinBorderDist) continue;
      if (near && Math.hypot(x - near.x, y - near.y) > maxDist) continue;
      return { x, y };
    }
    return null;
  }

  /** A point inside Bangladesh near `near` (for power-up drops by the hero). */
  insidePoint(near) {
    let best = null;
    let bestD = Infinity;
    for (let tries = 0; tries < 60; tries++) {
      const x = near.x + rand(-L.ropeRange, L.ropeRange);
      const y = near.y + rand(-L.ropeRange, L.ropeRange);
      if (!inside(x, y)) continue;
      const d = Math.hypot(x - near.x, y - near.y);
      if (d < bestD) { bestD = d; best = { x, y }; }
    }
    return best;
  }

  // ---------------------------------------------------------------- spawning
  pickType() {
    const n = 1 + (this.level - 1) * L.unlockPerLevel;
    return weighted(this.wavePool(n));
  }

  // Game.warn() telegraphs a spawn at spawnPoint().
  spawnPoint() {
    const p = this.lurkPoint();
    return p && { ...p, tx: p.x, ty: p.y };
  }

  spawn(type, at = null, primary = !at) {
    const def = CHARACTERS[type];
    const p = at || this.spawnPoint();
    if (!def || !p) return;
    const main = def.tier === 1;
    const e = {
      type, def, x: p.x, y: p.y, tx: p.x, ty: p.y, phase: 0,
      hp: def.hp, maxHp: def.hp, r: def.radius,
      speed: this.lurkSpeed(def),
      t: 0, seed: Math.random() * 10, hitFlash: 0, hop: 0, summonT: def.summons?.every ?? 0,
      home: { x: p.x, y: p.y }, facing: 1, near: Infinity, pose: null,
      state: 'lurk', turnT: 0, wx: p.x, wy: p.y, dashT: 0,
    };
    if (main) {
      e.hp = e.maxHp = def.hp + this.mainCount * CONFIG.waves.mainHpPerAppearance; // tougher every appearance
      this.mainCount++;
      this.mainT = 0;
      sfx.boss();
      navigator.vibrate?.(80);
      this.hooks.onBanner?.(tr('lMainSpotted'), tr('lMainSub'));
    }
    this.pickWaypoint(e);
    this.enemies.push(e);
    // packs arrive together at lurk points next to the leader
    if (primary && def.group > 1) {
      for (let i = 1; i < def.group; i++) {
        const q = this.lurkPoint(e, CONFIG.spawn.packSpread);
        if (q) this.spawn(type, q);
      }
    }
  }

  /** Wander speed by tier (Hasina is the fastest), growing with the level. */
  lurkSpeed(def) {
    const base = def.tier === 1 ? L.mainSpeed
      : def.speed * (def.tier === 2 ? L.fastSpeedMul : L.lurkSpeedMul);
    return base * (1 + L.speedPerLevel * (this.level - 1));
  }

  /** Seconds between fresh waypoints: tier 3 dawdles, tier 2 and Hasina zigzag. */
  turnTime(def) {
    const [a, b] = def.tier === 1 ? L.turnMain : def.tier === 2 ? L.turnTier2 : L.turnTier3;
    return rand(a, b);
  }

  /** Next wander target: a lurk point within `waypointMaxDist` of the crook. */
  pickWaypoint(e) {
    const p = this.lurkPoint(e, L.waypointMaxDist);
    if (p) { e.wx = p.x; e.wy = p.y; }
    e.turnT = this.turnTime(e.def);
  }

  // ---------------------------------------------------------------- sneaking
  sneakInterval() {
    return Math.max(L.sneakEveryMin, L.sneakEvery * Math.pow(L.sneakSpeedup, this.level - 1));
  }

  /** One lurking tier 2/3 crook starts a run at Dhaka (never Hasina, never a roped one). */
  startSneak() {
    const cands = this.enemies.filter((e) => e.def.tier > 1 && e.state === 'lurk');
    if (!cands.length) return;
    const e = cands[Math.floor(Math.random() * cands.length)];
    e.state = 'sneak';
    e.near = 0; // red danger ring + red border glow while it is inside
    sfx.warn();
    this.floater(this.sx(e.x), this.sy(e.y) - this.rpx(e.r) - 14, tr('lSneaking'), '#ff8a8a', 1, true);
  }

  /** A sneaker reached Dhaka: the shield throws it back out, or it costs a ❤️. */
  gotIn(e) {
    if (this.shield > 0) {
      this.shield--;
      this.shake = FX.shieldShake;
      this.flash = FX.shieldFlash;
      sfx.shield();
      navigator.vibrate?.(120);
      this.floater(this.sx(e.x), this.sy(e.y) - 20, tr('shieldBroken'), '#7cffb2', 1.3);
      this.burst(e.x, e.y, '#7cffb2', 24);
      const p = this.lurkPoint(e, L.waypointMaxDist) || this.lurkPoint();
      if (p) { e.x = p.x; e.y = p.y; }
      e.state = 'lurk';
      e.near = Infinity;
      this.pickWaypoint(e);
      return;
    }
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.lives--;
    this.stats.leaked++;
    this.combo = 0;
    this.leakFlash = FX.leakFlash;
    this.shake = Math.max(this.shake, FX.shakeLeak);
    sfx.leak();
    navigator.vibrate?.(50);
    this.floater(this.sx(e.x), this.sy(e.y) - 20, tr('lGotIn'), '#ff5a6a', 1.3);
    this.burst(e.x, e.y, '#ff5a6a', 12);
    if (this.lives <= 0) this.gameOver('sneak');
  }

  // ---------------------------------------------------------------- hero
  /** The chase target's position: the crook itself while it lives, else null. */
  heroTargetPos() {
    const t = this.chaseTarget;
    if (!t) return null;
    return t.def ? (this.enemies.includes(t) ? t : null) : t;
  }

  reverse() {
    if (this.mode === 'playing') this.heroDir *= -1;
  }

  updateHero(dt) {
    if (this.rope) return; // stands still while the rope is out

    if (this.heroState === 'orbit') {
      this.heroA += this.heroDir * ((Math.PI * 2) / L.orbitLapTime) * dt;
      const nx = DHAKA[0] + Math.cos(this.heroA) * L.orbitRadius;
      const ny = DHAKA[1] + Math.sin(this.heroA) * L.orbitRadius;
      if (Math.abs(nx - this.hx) > 1e-4) this.heroFacing = nx < this.hx ? -1 : 1;
      this.hx = nx;
      this.hy = ny;
      return;
    }

    if (this.heroState === 'chase') {
      const p = this.heroTargetPos();
      if (!p) { this.heroState = 'return'; return; } // the target is gone
      const d = Math.hypot(p.x - this.hx, p.y - this.hy);
      if (d <= L.ropeRange * 0.95) { this.throwRope(p); return; } // in reach: stop and throw
      this.heroRun(dt, p, d);
      return;
    }

    // return: run to the nearest orbit point, then rejoin the circle
    const a = Math.atan2(this.hy - DHAKA[1], this.hx - DHAKA[0]);
    const p = { x: DHAKA[0] + Math.cos(a) * L.orbitRadius, y: DHAKA[1] + Math.sin(a) * L.orbitRadius };
    const d = Math.hypot(p.x - this.hx, p.y - this.hy);
    if (d <= L.heroRunSpeed * dt) {
      this.hx = p.x;
      this.hy = p.y;
      this.heroA = a;
      this.heroState = 'orbit';
      return;
    }
    this.heroRun(dt, p, d);
  }

  /** Move the hero one step toward `p` (distance `d`), kicking up dust. */
  heroRun(dt, p, d) {
    const step = L.heroRunSpeed * dt;
    const nx = this.hx + ((p.x - this.hx) / d) * step;
    const ny = this.hy + ((p.y - this.hy) / d) * step;
    if (Math.abs(nx - this.hx) > 1e-4) this.heroFacing = nx < this.hx ? -1 : 1;
    this.hx = nx;
    this.hy = ny;
    this.dustT -= dt;
    if (this.dustT <= 0) {
      this.dustT = FX.dustEvery;
      this.burst(this.hx, this.hy, 'rgba(178,170,150,0.7)', 1);
    }
  }

  // ---------------------------------------------------------------- rope
  strength(e) {
    return Math.pow(Math.max(1, e.hp), L.strengthExp) * (e.def.tier === 1 ? L.mainPullMul : 1);
  }

  /** Throw at a crook object (homing) or a fixed map point. */
  throwRope(target) {
    this.rope = {
      phase: 'out', x: this.hx, y: this.hy, tx: target.x, ty: target.y,
      target: target.def ? target : null,
    };
    if (Math.abs(target.x - this.hx) > 1e-4) this.heroFacing = target.x < this.hx ? -1 : 1;
    this.stats.taps++; this.waveStats.taps++;
    play('tap');
  }

  /** The loop lands: rope the nearest catchable character inside it. */
  landLoop() {
    const r = this.rope;
    const R = L.loopRadius * this.mods.tapRadius;
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (e.state === 'roped' || this.stealthAlpha(e) < 0.5) continue;
      const d = Math.hypot(e.x - r.tx, e.y - r.ty);
      if (d < R + e.r * 0.5 && d < bestD) { best = e; bestD = d; }
    }
    if (best?.def.dash && Math.random() < L.dodgeChance) { // dodger hops out of the loop
      const dx = best.x - r.tx, dy = best.y - r.ty;
      const d = Math.hypot(dx, dy) || 1;
      for (const sgn of [1, -1]) {
        const x = best.x + (dx / d) * L.dodgeDist * sgn, y = best.y + (dy / d) * L.dodgeDist * sgn;
        if (this.lurkOK(x, y)) { best.x = x; best.y = y; break; }
      }
      best.hop = 1;
      this.floater(this.sx(best.x), this.sy(best.y) - 24, tr('lDodged'), '#ffb4b4', 0.8, true);
      best = null;
    }
    if (!best) {
      if (this.combo > 0) this.floater(this.sx(r.tx), this.sy(r.ty), tr('comboLost'), '#ff8a8a', 0.6, true);
      this.combo = 0;
      sfx.miss();
      this.ripple(this.sx(r.tx), this.sy(r.ty));
      r.phase = 'back';
      return;
    }
    this.stats.hits++; this.waveStats.hits++;
    best.state = 'roped';
    best.pose = 'kicked';
    best.near = Infinity;
    best.hitFlash = CONFIG.combat.hitFlashTime;
    Object.assign(r, { phase: 'reel', target: best, cx: best.x, cy: best.y, auto: best.hp <= 1, tug: L.reelStart, autoT: 0 });
    sfx.hit();
    this.burst(best.x, best.y, '#c9a26b', 10);
    this.quip(best); // "Not again!" as the loop lands (CONFIG.fun)
  }

  updateRope(dt) {
    const r = this.rope;
    if (!r) return;
    const step = L.ropeSpeed * dt;
    if (r.phase === 'out') {
      // a homing loop follows the tapped crook (its last spot once it is gone)
      if (L.homing && r.target && this.enemies.includes(r.target)) {
        r.tx = r.target.x;
        r.ty = r.target.y;
      }
      const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
      if (d <= step) { r.x = r.tx; r.y = r.ty; this.landLoop(); } else { r.x += (dx / d) * step; r.y += (dy / d) * step; }
      return;
    }
    if (r.phase === 'back') {
      const dx = this.hx - r.x, dy = this.hy - r.y, d = Math.hypot(dx, dy);
      if (d <= step) {
        this.rope = null;
        if (this.heroState !== 'orbit') this.heroState = 'return'; // back to the circle
      } else { r.x += (dx / d) * step; r.y += (dy / d) * step; }
      return;
    }
    // reel
    const e = r.target;
    if (!this.enemies.includes(e)) { r.phase = 'back'; return; }
    let prog;
    if (r.auto) {
      r.autoT += dt;
      prog = r.autoT / L.autoReelTime;
    } else {
      if (this.freezeT <= 0) r.tug -= L.pullBase * this.strength(e) * dt;
      if (r.tug <= 0) { this.snap(e); return; }
      prog = (r.tug - L.reelStart) / (1 - L.reelStart);
    }
    if ((r.auto && prog >= 1) || (!r.auto && r.tug >= 1)) { this.lockUp(e); return; }
    const f = clamp(prog, 0, 1) * 0.85; // stop just short of the hero
    e.x = r.cx + (this.hx - r.cx) * f;
    e.y = r.cy + (this.hy - r.cy) * f;
    e.facing = this.hx < e.x ? 1 : -1; // pulling away from the hero
    r.x = e.x; r.y = e.y;
  }

  /** The rope snaps: the character dashes away from the hero, then lurks again. */
  snap(e) {
    const dx = e.x - this.hx, dy = e.y - this.hy, d = Math.hypot(dx, dy) || 1;
    Object.assign(e, {
      state: 'dash', dashT: L.breakDashTime, pose: null, near: Infinity,
      tx: e.x + (dx / d) * L.ropeRange, ty: e.y + (dy / d) * L.ropeRange,
    });
    this.floater(this.sx(e.x), this.sy(e.y) - 24, tr('lSnapped'), '#ff8a8a', 1);
    this.combo = 0;
    play('leak');
    this.rope.phase = 'back';
    this.rope.target = null;
  }

  // ---------------------------------------------------------------- lockup
  /** The tug meter is full: score the catch and fling the crook into the jail. */
  lockUp(e) {
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.rope = null;
    this.heroState = 'return';
    const oldMult = this.multiplier();
    if (this.time - this.lastCatch < this.mods.comboWindow) this.combo++; else this.combo = 1;
    this.lastCatch = this.time;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const mult = this.multiplier();
    const isMain = e.def.tier === 1;
    const pts = (isMain ? L.mainPoints : e.def.points) * mult;
    this.score += pts;
    this.floater(this.sx(e.x), this.sy(e.y) - 24, `+${fmt(pts)}`, mult > 1 ? '#ffe15a' : '#ffffff', isMain ? 1.6 : 1);
    this.burst(e.x, e.y, e.def.color, isMain ? 40 : 14);
    play(e.def.sound || 'catch', this.combo);
    play(HEROES[this.hero]?.sound || 'kick');
    if (mult > oldMult) sfx.combo();
    if (isMain) { this.shake = 0.4; navigator.vibrate?.([40, 30, 40]); }
    this.cheerT = L.cheerTime;
    if (Math.random() < (isMain ? 1 : CONFIG.powerups.dropChance + this.mods.dropBonus)) {
      const p = this.insidePoint({ x: this.hx, y: this.hy }); // drops land inside BD, near the hero
      if (p) this.dropPowerup(p.x, p.y);
    }
    if (e.def.splits) { // splitters scatter into lurkers near where they were roped
      const { into, n } = e.def.splits;
      for (let i = 0; i < n; i++) {
        const p = this.lurkPoint(e, L.waypointMaxDist);
        if (p) this.spawn(into[Math.floor(Math.random() * into.length)], p);
      }
    }
    this.yanks.push({ def: e.def, type: e.type, x0: e.x, y0: e.y, t: 0 });
  }

  /** Crooks flying into the jail; on landing they are locked up. */
  updateYanks(dt) {
    for (const y of [...this.yanks]) {
      y.t += dt;
      if (y.t < L.yankTime) continue;
      this.yanks.splice(this.yanks.indexOf(y), 1);
      this.jail.push(y.type);
      this.locked++;
      this.stats.caught++;
      this.burst(DHAKA[0], DHAKA[1], '#9aa0a6', 12); // dust as it hits the cell
      sfx.hit();
      this.jailShakeT = FX.jailShake;
      if (this.locked % L.levelEvery === 0) { // level up: banner, faster spawn rate
        this.level++;
        this.wave = this.level;
        this.spawnInterval = Math.max(L.spawnEveryMin, L.spawnEvery * Math.pow(L.spawnSpeedup, this.level - 1));
        this.hooks.onBanner?.(tr('lLevelUp', { n: this.level }));
        sfx.wave();
      }
      if (y.def.tier === 1) this.win(y);
    }
  }

  win(yank = null) {
    this.won = true;
    this.score += L.winBonusPerLife * this.lives;
    this.stats.mains++;
    // Hasina always gets the last word, from inside the jail.
    if (yank?.def) this.quip({ def: yank.def, x: DHAKA[0], y: DHAKA[1] }, true);
    // gold confetti: a big many-coloured burst around the jail
    const confetti = ['#ffe15a', '#ffd700', '#fff6c9', '#ffb4b4', '#7cffb2', '#6fd3ff'];
    for (let i = 0; i < confetti.length; i++) {
      const a = (i / confetti.length) * Math.PI * 2;
      this.burst(DHAKA[0] + Math.cos(a) * L.gotInRadius, DHAKA[1] + Math.sin(a) * L.gotInRadius, confetti[i], 26);
    }
    this.hooks.onBanner?.(tr('lWinTitle'));
    sfx.cleared();
    this.mode = 'over';
    setTimeout(() => this.hooks.onGameOver?.(this.summary()), 1600);
  }

  /** Fade a character out, moving away from the map centre (reuses the flee effect). */
  haulAway(e) {
    const dx = e.x - DHAKA[0], dy = e.y - DHAKA[1], d = Math.hypot(dx, dy) || 1;
    this.fleeing.push({
      def: e.def, type: e.type, x: this.sx(e.x), y: this.sy(e.y),
      vx: (dx / d) * CONFIG.kick.fleeSpeedPx, vy: (dy / d) * CONFIG.kick.fleeSpeedPx,
      traveled: 0, spin: Math.random() * Math.PI * 2,
    });
  }

  /** Hasina overstayed her welcome: she fades away and cools down before returning. */
  mainSlip(e) {
    this.enemies.splice(this.enemies.indexOf(e), 1);
    if (this.rope?.target === e) this.rope = null;
    this.haulAway(e);
    this.hooks.onBanner?.(tr('lMainGone'));
    this.mainCooldownT = L.mainCooldown;
    this.mainT = 0;
  }

  // ---------------------------------------------------------------- input
  onPointer(ev) {
    if (!this.active || this.mode !== 'playing') return;
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left, py = ev.clientY - rect.top;
    // power-ups first
    for (const pu of this.powerups) {
      if (Math.hypot(this.sx(pu.x) - px, this.sy(pu.y) - py) < CONFIG.input.powerupTapRadiusPx) { this.collect(pu); return; }
    }
    const r = this.rope;
    if (r?.phase === 'reel') { // reeling a tough crook: every tap pulls
      if (!r.auto) {
        r.tug += L.reelPerTap / this.strength(r.target);
        this.ripple(px, py);
        sfx.hit();
      }
      return;
    }
    if (r) return; // the rope is still flying
    // the crook under the tap, else the tapped spot itself
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      const d = Math.hypot(this.sx(e.x) - px, this.sy(e.y) - py);
      const hitR = Math.max(this.rpx(e.r) * CONFIG.input.hitRadiusMultiplier, CONFIG.input.minHitRadiusPx) * this.mods.tapRadius;
      if (d < hitR && d < bestD) { best = e; bestD = d; }
    }
    const target = best ?? { x: (px - this.ox) / this.s, y: (py - this.oy) / this.s };
    if (Math.hypot(target.x - this.hx, target.y - this.hy) <= L.ropeRange) this.throwRope(target);
    else { this.chaseTarget = target; this.heroState = 'chase'; } // out of reach: run there first
  }

  // ---------------------------------------------------------------- update
  updateEffects(dt) {
    super.updateEffects(dt);
    this.cheerT = Math.max(0, this.cheerT - dt);
    this.jailShakeT = Math.max(0, this.jailShakeT - dt);
  }

  updatePlay(dt) {
    this.time += dt;
    this.freezeT = Math.max(0, this.freezeT - dt);
    if (this.time - this.lastCatch > this.mods.comboWindow) this.combo = 0;

    // population: keep the map filled up to the level cap
    const cap = Math.min(L.maxOnMapCap, Math.floor(L.maxOnMapBase + L.maxOnMapPerLevel * (this.level - 1)));
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.enemies.length + this.warnings.length < cap) {
      this.warn(this.pickType());
      this.spawnT = this.spawnInterval * rand(CONFIG.waves.jitterMin, CONFIG.waves.jitterMax);
    }

    // Hasina: schedule once enough crooks are locked up, then telegraph her
    if (this.mainCooldownT > 0) this.mainCooldownT -= dt;
    if (this.mainAt !== null) {
      this.mainAt -= dt;
      if (this.mainAt <= 0) { this.mainAt = null; this.warn(MAIN_ID); }
    } else if (
      this.locked >= L.mainAfterLocked && this.mainCooldownT <= 0
      && !this.enemies.some((e) => e.def.tier === 1)
      && !this.warnings.some((w) => w.type === MAIN_ID)
    ) {
      this.mainAt = rand(L.mainDelay[0], L.mainDelay[1]);
    }

    // sneak attempts, more often at higher levels
    this.sneakT -= dt;
    if (this.sneakT <= 0) {
      this.startSneak();
      this.sneakT = this.sneakInterval() * rand(CONFIG.waves.jitterMin, CONFIG.waves.jitterMax);
    }

    for (const w of [...this.warnings]) {
      w.t -= dt;
      if (w.t <= 0) { this.warnings.splice(this.warnings.indexOf(w), 1); this.spawn(w.type, w.p, true); }
    }

    for (const pu of this.powerups) pu.t += dt;
    this.powerups = this.powerups.filter((pu) => pu.t < pu.life);

    this.updateHero(dt);
    this.updateRope(dt);
    if (this.mode !== 'playing') return;
    this.updateYanks(dt);

    const frozen = this.freezeT > 0;
    for (const e of [...this.enemies]) {
      e.t += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.hop > 0) e.hop = Math.max(0, e.hop - dt / FX.hopFade);
      if (e.state === 'roped' || frozen) continue;

      if (e.state === 'sneak') { // straight to Dhaka, no detours
        const spd = L.sneakSpeed + this.level * L.sneakSpeedPerLevel;
        const dx = DHAKA[0] - e.x, dy = DHAKA[1] - e.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * spd * dt;
        e.y += (dy / d) * spd * dt;
        if (Math.abs(dx) > 0.01) e.facing = dx < 0 ? -1 : 1;
        if (d <= L.gotInRadius) {
          this.gotIn(e);
          if (this.mode !== 'playing') return;
        }
        continue;
      }

      let spd = e.speed;
      if (e.state === 'dash') { // broken free: dash out, then lurk again
        spd *= L.breakDashMul;
        e.dashT -= dt;
        if (e.dashT <= 0) { e.state = 'lurk'; this.pickWaypoint(e); }
      } else { // lurk: fresh waypoint every few seconds (per-tier timer)
        e.turnT -= dt;
        if (e.turnT <= 0) this.pickWaypoint(e);
      }
      const tx = e.state === 'lurk' ? e.wx : e.tx;
      const ty = e.state === 'lurk' ? e.wy : e.ty;
      const dx = tx - e.x, dy = ty - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let vx = (dx / d) * spd, vy = (dy / d) * spd;
      if (e.def.wobble && e.state === 'lurk') {
        const w = Math.sin(e.t * CONFIG.combat.wobbleFrequency + e.seed) * spd * CONFIG.combat.wobbleAmplitude;
        vx += (-dy / d) * w; vy += (dx / d) * w;
      }
      const nx = e.x + vx * dt, ny = e.y + vy * dt;
      if (e.state === 'lurk') {
        // reached the waypoint, or the next step would leave the lurk ground
        if (d < CONFIG.combat.phaseSwitchDistance) { this.pickWaypoint(e); continue; }
        if (this.lurkOK(e.x, e.y) && !this.lurkOK(nx, ny)) { this.pickWaypoint(e); continue; }
      }
      e.x = nx; e.y = ny;
      if (Math.abs(vx) > 0.01) e.facing = vx < 0 ? -1 : 1;

      if (e.def.summons) { // summoners call helpers to lurk points beside them
        e.summonT -= dt;
        if (e.summonT <= 0) {
          e.summonT = Math.max(CONFIG.spawn.summonMinInterval, e.def.summons.every - this.wave * CONFIG.spawn.summonSpeedupPerWave);
          const kinds = e.def.summons.types;
          const p = this.lurkPoint(e, CONFIG.spawn.summonSpread);
          if (p && this.enemies.length < L.maxOnMapCap) this.spawn(kinds[Math.floor(Math.random() * kinds.length)], p);
        }
      }
    }

    // Hasina slips away after mainStay s on the map (her timer pauses while roped)
    const main = this.enemies.find((e) => e.def.tier === 1);
    if (main && main.state !== 'roped') {
      this.mainT += dt;
      if (this.mainT >= L.mainStay) this.mainSlip(main);
    }
  }

  // ---------------------------------------------------------------- render
  drawHint(t) {
    if (this.mode !== 'playing' || this.locked || this.rope) return;
    this.hintText(tr('lHint'), this.sx(this.hx), this.sy(this.hy) - L.heroSizePx * 0.8 - Math.abs(Math.sin(t * 6)) * 6);
  }

  drawBossBar() {
    const boss = this.enemies.find((e) => e.def.tier === 1);
    if (!boss || this.mode === 'menu') return;
    const { ctx } = this;
    const r = this.rope;
    const roped = r?.target === boss;
    const fill = roped
      ? clamp(r.auto ? r.autoT / L.autoReelTime : r.tug, 0, 1)
      : clamp(1 - this.mainT / L.mainStay, 0, 1);
    const bw = Math.min(360, this.w - 40), bh = 12;
    const x = (this.w - bw) / 2, y = this.insets.top + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 2, y - 2, bw + 4, bh + 4);
    ctx.fillStyle = roped ? '#c9a26b' : '#ffd700';
    ctx.fillRect(x, y, bw * fill, bh);
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const left = fmt(Math.max(0, Math.ceil(L.mainStay - this.mainT)));
    ctx.fillText(`${boss.def.emoji} ${tr(`char.${boss.type}`)} · ${tr(roped ? 'lReeling' : 'lOnTheLoose')}${roped ? '' : ` · ${left}s`}`, this.w / 2, y + bh / 2 + 1);
  }

  heroSprite(def) {
    const want = this.rope?.phase === 'reel' ? ['pull', 'kick'] : this.rope ? ['throw', 'kick'] : this.cheerT > 0 ? ['cheer'] : ['run'];
    for (const p of want) if (hasAsset(def.sprites?.[p])) return getSprite(def, p);
    return getSprite(def, 'ready');
  }

  /** The jail at Dhaka: a stone box with prisoners behind bars and a 🔒 count. */
  drawJail() {
    const { ctx } = this;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = Math.max(84, this.s * 0.75);
    const h = w * 0.75;
    ctx.save();
    const jx = this.sx(DHAKA[0]);
    const jy = this.sy(DHAKA[1]);
    if (this.jailShakeT > 0) ctx.translate(jx + rand(-FX.jailShakePx, FX.jailShakePx), jy + rand(-FX.jailShakePx, FX.jailShakePx));
    else ctx.translate(jx, jy);
    // stone box
    roundRect(ctx, -w / 2, -h / 2, w, h, 8);
    ctx.fillStyle = '#3b3f47';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#9aa0a6';
    ctx.stroke();
    // the last 8 prisoners in a 4×2 grid
    const inmates = this.jail.slice(-8);
    const cols = 4, rows = 2;
    const cw = w / cols, ch = h / rows;
    inmates.forEach((type, i) => {
      const cdef = CHARACTERS[type];
      if (!cdef) return;
      const gx = -w / 2 + (i % cols) * cw + cw / 2;
      const gy = -h / 2 + Math.floor(i / cols) * ch + ch / 2;
      const r = Math.min(cw, ch) * 0.4;
      const spr = getSprite(cdef, 'idle');
      if (spr) ctx.drawImage(spr, gx - r, gy - r, r * 2, r * 2);
      else {
        ctx.fillStyle = cdef.color;
        ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();
        ctx.font = `${r * 1.2}px ${EMOJI_FONT}`;
        ctx.fillText(cdef.emoji, gx, gy);
      }
    });
    // dark vertical bars over them
    ctx.fillStyle = 'rgba(20,22,26,0.9)';
    const bars = 4; // few, thin bars so the faces stay readable
    const barW = Math.max(2, w * 0.03);
    for (let i = 1; i <= bars; i++) {
      const bx = -w / 2 + (w / (bars + 1)) * i;
      ctx.fillRect(bx - barW / 2, -h / 2, barW, h);
    }
    // padlock + count badge on top
    const label = `🔒 ${fmt(this.locked)}`;
    ctx.font = '800 12px system-ui, sans-serif';
    const tw = ctx.measureText(label).width + 14;
    roundRect(ctx, -tw / 2, -h / 2 - 20, tw, 18, 9);
    ctx.fillStyle = '#1c1f24';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#9aa0a6';
    ctx.stroke();
    ctx.fillStyle = '#ffe15a';
    ctx.fillText(label, 0, -h / 2 - 11);
    ctx.restore();
  }

  /** Caught crooks spinning along a parabola into the jail. */
  drawYanks() {
    const { ctx } = this;
    const jx = this.sx(DHAKA[0]);
    const jy = this.sy(DHAKA[1]);
    for (const y of this.yanks) {
      const k = clamp(y.t / L.yankTime, 0, 1);
      const x = this.sx(y.x0) + (jx - this.sx(y.x0)) * k;
      const yy = this.sy(y.y0) + (jy - this.sy(y.y0)) * k - 4 * L.yankArcPx * k * (1 - k);
      const r = this.rpx(y.def.radius);
      ctx.save();
      ctx.translate(x, yy);
      ctx.rotate(y.t * FX.spinSpeed);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const spr = getSprite(y.def, 'kicked');
      if (spr) {
        if (!hasPose(y.def, 'kicked')) {
          // One image per character: fake the kicked pose with a backward lean + squash.
          ctx.rotate(-18 * Math.PI / 180);
          ctx.scale(1.06, 0.92);
        }
        ctx.drawImage(spr, -r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
      } else {
        ctx.fillStyle = y.def.color;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.stroke();
        ctx.font = `${r * 1.25}px ${EMOJI_FONT}`;
        ctx.fillText(y.def.emoji, 0, 0);
      }
      ctx.restore();
    }
  }

  drawLayer(t) {
    if (this.mode === 'menu') return;
    const { ctx } = this;
    const def = HEROES[this.hero] || HEROES[Object.keys(HEROES)[0]];
    const size = L.heroSizePx;

    // 1. the jail at Dhaka
    this.drawJail();

    // 2. the hero's orbit
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.sx(DHAKA[0]), this.sy(DHAKA[1]), L.orbitRadius * this.s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. sneakers run a red dashed line to Dhaka
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(255,60,80,0.55)';
    ctx.lineWidth = 2;
    for (const e of this.enemies) {
      if (e.state !== 'sneak') continue;
      ctx.beginPath();
      ctx.moveTo(this.sx(e.x), this.sy(e.y));
      ctx.lineTo(this.sx(DHAKA[0]), this.sy(DHAKA[1]));
      ctx.stroke();
    }
    ctx.restore();

    // 4. lockup deliveries flying into the jail
    this.drawYanks();

    const hx = this.sx(this.hx), hy = this.sy(this.hy);
    const running = !this.rope && this.mode === 'playing';
    const bob = running ? Math.abs(Math.sin(t * 12)) * 3 : 0;
    const handX = hx + this.heroFacing * size * 0.22, handY = hy - size * 0.18 - bob;

    // 5. rope + loop + tug meter
    const r = this.rope;
    if (r) {
      const ex = this.sx(r.x), ey = this.sy(r.y);
      const len = Math.hypot(ex - handX, ey - handY);
      const sag = r.phase === 'reel' ? 4 : 10 + len * 0.08;
      ctx.strokeStyle = '#c9a26b';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.quadraticCurveTo((handX + ex) / 2, (handY + ey) / 2 + sag, ex, ey);
      ctx.stroke();
      const loopR = r.phase === 'reel' ? this.rpx(r.target.r) * 1.1 : L.loopRadius * this.mods.tapRadius * this.s;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(ex, ey, loopR, loopR * 0.6, r.phase === 'out' ? (t * 8) % (Math.PI * 2) : 0, 0, Math.PI * 2);
      ctx.stroke();

      if (r.phase === 'reel' && !r.auto) {
        const bw = 54, bh = 7, bx = ex - bw / 2, by = ey - this.rpx(r.target.r) * CONFIG.sprites.heightMul * 0.6 - 26;
        const v = clamp(r.tug, 0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
        ctx.fillStyle = v > 0.6 ? '#7cffb2' : v > 0.3 ? '#ffe15a' : '#ff5a5a';
        ctx.fillRect(bx, by, bw * v, bh);
        const pulse = 1 + 0.15 * Math.sin(t * 18);
        ctx.save();
        ctx.translate(ex, by - 14);
        ctx.scale(pulse, pulse);
        this.hintText(tr('lTapFast'), 0, 0);
        ctx.restore();
      }
    }

    // 6. chase: a dotted line to the target (dust puffs come from the particles)
    if (!r && this.heroState === 'chase') {
      const p = this.heroTargetPos();
      if (p) {
        ctx.save();
        ctx.setLineDash([2, 7]);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(this.sx(p.x), this.sy(p.y));
        ctx.stroke();
        ctx.restore();
      }
    }

    // 7. the hero (sprite poses when present, emoji disc otherwise)
    const sprite = this.heroSprite(def);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(hx, hy + size * 0.42, size * 0.32, size * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(hx, hy - bob);
    if (sprite) {
      if (this.heroFacing < 0) ctx.scale(-1, 1); // sprites face right
      // One image per hero: fake the rope poses by leaning the ready pose.
      if (r?.phase === 'reel' && !hasPose(def, 'pull')) ctx.rotate(-12 * Math.PI / 180); // leaning back
      else if (r && r.phase !== 'reel' && !hasPose(def, 'throw')) ctx.rotate(10 * Math.PI / 180); // lean into the throw
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
    } else {
      const rr = size * 0.4;
      ctx.fillStyle = def.color;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.cheerT > 0 ? '#ffe15a' : 'rgba(0,0,0,0.5)';
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${rr * 1.3}px ${EMOJI_FONT}`;
      ctx.fillText(def.emoji, 0, 0);
      if (!r) { // coiled rope on the hip
        ctx.font = `${rr * 0.8}px ${EMOJI_FONT}`;
        ctx.fillText('🪢', rr * 0.9 * this.heroFacing, rr * 0.5);
      }
    }
    ctx.restore();
    // range ring while idle, so players learn the reach
    if (!r && this.mode === 'playing') {
      ctx.strokeStyle = 'rgba(201,162,107,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(hx, hy, L.ropeRange * this.s, 0, Math.PI * 2); ctx.stroke();
    }
  }
}
