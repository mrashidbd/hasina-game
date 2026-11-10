// "Rope 'Em!" mode: everyone is already inside Bangladesh and lurks around; after a
// while each one bolts for the India border. The hero patrols a loop just inside the
// border and throws a rope at taps; tough characters must be reeled in by tapping.
// Design: docs/PLAN-lasso.md. Tunables: CONFIG.lasso.
import { Game, rand, clamp, weighted, EMOJI_FONT } from './game.js';
import { BD, INDIA_EDGES, DHAKA, pointInPoly, distToPoly } from './map.js';
import { CHARACTERS, MAIN_ID } from './data/enemies.js';
import { HEROES } from './data/heroes.js';
import { sfx, play } from './audio.js';
import { t as tr, fmt } from './i18n.js';
import { CONFIG } from './config.js';
import { getSprite, hasAsset } from './assets.js';

const L = CONFIG.lasso;

const BD_BOX = BD.reduce((b, [x, y]) => ({
  minX: Math.min(b.minX, x), maxX: Math.max(b.maxX, x), minY: Math.min(b.minY, y), maxY: Math.max(b.maxY, y),
}), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

/** The hero's patrol loop: the mainland outline resampled, pushed inside and smoothed. */
function buildPatrol() {
  const ring = [...BD, BD[0]];
  let total = 0;
  const seg = [];
  for (let i = 0; i < ring.length - 1; i++) {
    const len = Math.hypot(ring[i + 1][0] - ring[i][0], ring[i + 1][1] - ring[i][1]);
    seg.push(len); total += len;
  }
  // equal arc-length samples
  const raw = [];
  let i = 0, acc = 0;
  for (let k = 0; k < L.pathPoints; k++) {
    const d = (k / L.pathPoints) * total;
    while (acc + seg[i] < d && i < seg.length - 1) { acc += seg[i]; i++; }
    const f = seg[i] ? (d - acc) / seg[i] : 0;
    const [ax, ay] = ring[i], [bx, by] = ring[i + 1];
    raw.push([ax + (bx - ax) * f, ay + (by - ay) * f, by - ay, ax - bx]); // point + a normal
  }
  // push inside along the normal (whichever side is inside)
  const inset = raw.map(([x, y, nx, ny]) => {
    const n = Math.hypot(nx, ny) || 1;
    for (const sgn of [1, -1]) {
      const px = x + (nx / n) * L.pathInset * sgn, py = y + (ny / n) * L.pathInset * sgn;
      if (pointInPoly(BD, px, py)) return [px, py];
    }
    return [x, y];
  });
  // circular moving average
  const N = inset.length, w = L.pathSmooth;
  const pts = inset.map((_, k) => {
    let sx = 0, sy = 0;
    for (let j = -w; j <= w; j++) { const p = inset[(k + j + N) % N]; sx += p[0]; sy += p[1]; }
    return [sx / (2 * w + 1), sy / (2 * w + 1)];
  });
  const cum = [0];
  for (let k = 1; k <= N; k++) {
    const a = pts[k - 1], b = pts[k % N];
    cum.push(cum[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, cum, len: cum[N] };
}
const PATROL = buildPatrol();

/** Closest point on the India border to (x, y). */
function nearestIndiaPoint(x, y) {
  let best = null, bestD = Infinity;
  for (const { a, b } of INDIA_EDGES) {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const f = clamp(((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    const px = a[0] + dx * f, py = a[1] + dy * f;
    const d = Math.hypot(px - x, py - y);
    if (d < bestD) { bestD = d; best = [px, py]; }
  }
  return best;
}

const inside = (x, y) => pointInPoly(BD, x, y);

export class LassoGame extends Game {
  reset() {
    super.reset();
    this.roundT = 0;
    this.target = 0;
    this.caughtRound = 0;
    this.targetLeft = null; // round time left when the target was reached
    this.rope = null;
    this.heroS = 0;
    this.heroDir = 1;
    this.heroFacing = 1;
    this.cheerT = 0;
    this.mainAt = null;
    this.mainThisRound = false;
    this.reason = '';
    this.speedMul = 1;
  }

  buildPaths() {
    super.buildPaths();
    this.patrolPath = new Path2D();
    PATROL.pts.forEach(([x, y], i) => (i ? this.patrolPath.lineTo : this.patrolPath.moveTo).call(this.patrolPath, this.sx(x), this.sy(y)));
    this.patrolPath.closePath();
  }

  powerupKinds() { return L.powerups; }
  leakLabel() { return tr('lEscaped'); }
  useSweep() {} // no sweep in this mode

  // ---------------------------------------------------------------- rounds
  /** Called by Game.start(); a "wave" is a round here (HUD and summary use `wave`). */
  nextWave() {
    this.wave += 1;
    const n = this.wave;
    this.waveStats = { taps: 0, hits: 0, leaks: 0 };
    this.roundT = L.roundTime;
    this.target = L.targetBase + L.targetPerRound * n;
    this.caughtRound = 0;
    this.targetLeft = null;
    this.speedMul = 1 + L.speedPerRound * (n - 1);
    this.spawnInterval = Math.max(L.spawnEveryMin, L.spawnEvery * Math.pow(L.spawnSpeedup, n - 1));
    this.spawnT = L.firstSpawnDelay;
    this.mainThisRound = false;
    const main = n >= L.mainFromRound && (n % L.mainEveryRound === 0 || Math.random() < L.mainChance);
    this.mainAt = main ? rand(5, L.roundTime / 2) : null;
    this.hooks.onBanner?.(tr('lRoundTitle', { n }), tr('lRoundSub', { n: this.target }));
    sfx.wave();
  }

  endRound() {
    if (this.caughtRound < this.target) { this.gameOver('target'); return; }
    const n = this.wave;
    const timeBonus = Math.round((this.targetLeft ?? 0) * L.timeBonusPerSec);
    const bonus = L.roundBonus * n + timeBonus;
    this.score += bonus;
    let sub = tr('clearBonus', { n: L.roundBonus * n });
    if (timeBonus) sub += ` · ${tr('lTimeBonus', { n: timeBonus })}`;
    this.hooks.onBanner?.(tr('lCleared', { n }), sub);
    sfx.cleared();
    // Whoever is still around slips away; the next round starts fresh.
    for (const e of this.enemies) this.haulAway(e);
    this.enemies = [];
    this.warnings = [];
    this.rope = null;
    this.breakT = L.breakTime;
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
      ...super.summary(), mode: 'lasso', round: this.wave, escaped: this.stats.leaked,
      reason: this.reason, target: this.target, caughtRound: this.caughtRound,
    };
  }

  // ---------------------------------------------------------------- spawning
  pickType() {
    const n = 1 + (this.wave - 1) * L.unlockPerRound;
    return weighted(this.wavePool(n));
  }

  /** Random point inside the mainland, away from the border and the hero. */
  insidePoint(near = null, spread = 0) {
    const h = this.heroPos();
    for (let tries = 0; tries < 60; tries++) {
      const x = near ? near.x + rand(-spread, spread) : rand(BD_BOX.minX, BD_BOX.maxX);
      const y = near ? near.y + rand(-spread, spread) : rand(BD_BOX.minY, BD_BOX.maxY);
      if (!inside(x, y) || distToPoly(BD, x, y) < 0.15) continue;
      if (!near && Math.hypot(x - h.x, y - h.y) < L.spawnHeroGap) continue;
      return { x, y };
    }
    return near ? { x: near.x, y: near.y } : null;
  }

  // Game.warn() telegraphs a spawn at spawnPoint().
  spawnPoint() {
    const p = this.insidePoint();
    return p && { ...p, tx: p.x, ty: p.y };
  }

  spawn(type, at = null, primary = !at) {
    const def = CHARACTERS[type];
    const p = at || this.insidePoint();
    if (!def || !p) return;
    const main = def.tier === 1;
    const base = main ? L.mainSpeed : def.speed * L.speedMul;
    const e = {
      type, def, x: p.x, y: p.y, tx: p.x, ty: p.y, phase: 0,
      hp: def.hp, maxHp: def.hp, r: def.radius,
      speed: base * this.speedMul * rand(CONFIG.spawn.speedJitterMin, CONFIG.spawn.speedJitterMax),
      t: 0, seed: Math.random() * 10, hitFlash: 0, hop: 0, summonT: def.summons?.every ?? 0,
      home: { x: p.x, y: p.y }, facing: 1, near: Infinity, pose: null,
      state: 'lurk', lurkT: this.lurkTime(def), wx: p.x, wy: p.y, dashT: 0,
    };
    if (main) {
      e.hp = e.maxHp = def.hp + this.mainCount * CONFIG.waves.mainHpPerAppearance;
      this.mainCount++;
      sfx.boss();
      navigator.vibrate?.(80);
      this.hooks.onBanner?.(tr('lMainSpotted'), tr('lMainSub'));
    }
    this.pickWaypoint(e);
    this.enemies.push(e);
    if (primary && def.group > 1) {
      for (let i = 1; i < def.group; i++) this.spawn(type, this.insidePoint(p, CONFIG.spawn.packSpread));
    }
  }

  lurkTime(def) {
    const mul = def.tier === 1 ? L.mainLurkMul : def.tier === 2 ? L.lurkTier2Mul : 1;
    return rand(L.lurkMin, L.lurkMax) * mul;
  }

  /** Next lurk waypoint: inside BD, far enough, and the straight walk there stays inside. */
  pickWaypoint(e) {
    for (let tries = 0; tries < 30; tries++) {
      const p = this.insidePoint(e, 1.6);
      if (!p || Math.hypot(p.x - e.x, p.y - e.y) < L.waypointMinDist) continue;
      if (![0.25, 0.5, 0.75].every((f) => inside(e.x + (p.x - e.x) * f, e.y + (p.y - e.y) * f))) continue;
      e.wx = p.x; e.wy = p.y;
      return;
    }
    e.wx = DHAKA[0]; e.wy = DHAKA[1];
  }

  startBolt(e) {
    e.state = 'bolt';
    const b = nearestIndiaPoint(e.x, e.y);
    const dx = b[0] - e.x, dy = b[1] - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.tx = b[0] + (dx / d) * L.boltOvershoot;
    e.ty = b[1] + (dy / d) * L.boltOvershoot;
  }

  breach(e) {
    if (this.rope?.target === e) this.rope = null;
    if (e.def.tier === 1) {
      if (this.shield > 0) { // the shield drags her back inside
        this.shield--;
        this.shake = 0.5; this.flash = 0.3;
        sfx.shield();
        navigator.vibrate?.(120);
        this.floater(this.sx(e.x), this.sy(e.y) - 20, tr('shieldBroken'), '#7cffb2', 1.3);
        this.burst(e.x, e.y, '#7cffb2', 24);
        const p = this.insidePoint() || { x: DHAKA[0], y: DHAKA[1] };
        Object.assign(e, { x: p.x, y: p.y, state: 'lurk', lurkT: this.lurkTime(e.def), near: Infinity });
        this.pickWaypoint(e);
        return;
      }
      this.reason = 'escape';
    }
    super.breach(e);
  }

  // ---------------------------------------------------------------- hero
  heroPos(s = this.heroS) {
    const { pts, cum, len } = PATROL;
    const d = ((s % len) + len) % len;
    let k = 0;
    while (k < pts.length - 1 && cum[k + 1] < d) k++;
    const a = pts[k], b = pts[(k + 1) % pts.length];
    const f = (d - cum[k]) / ((cum[k + 1] - cum[k]) || 1);
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f };
  }

  reverse() {
    if (this.mode === 'playing') this.heroDir *= -1;
  }

  updateHero(dt) {
    if (this.rope) return; // stands still while throwing / reeling
    const before = this.heroPos();
    this.heroS += this.heroDir * (PATROL.len / L.heroLapTime) * dt;
    const after = this.heroPos();
    if (Math.abs(after.x - before.x) > 1e-4) this.heroFacing = after.x < before.x ? -1 : 1;
  }

  // ---------------------------------------------------------------- rope
  strength(e) {
    return Math.pow(Math.max(1, e.hp), L.strengthExp) * (e.def.tier === 1 ? L.mainPullMul : 1);
  }

  throwRope(mx, my) {
    const h = this.heroPos();
    let dx = mx - h.x, dy = my - h.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > L.ropeRange) {
      dx *= L.ropeRange / d; dy *= L.ropeRange / d;
      this.floater(this.sx(mx), this.sy(my) - 16, tr('lTooFar'), '#ffb4b4', 0.7, true);
    }
    this.rope = { phase: 'out', x: h.x, y: h.y, tx: h.x + dx, ty: h.y + dy, target: null };
    if (Math.abs(dx) > 1e-4) this.heroFacing = dx < 0 ? -1 : 1;
    this.stats.taps++; this.waveStats.taps++;
    play('tap');
  }

  /** The loop lands: rope the nearest catchable character inside it. */
  landLoop() {
    const r = this.rope;
    const R = L.loopRadius * this.mods.tapRadius;
    let best = null, bestD = Infinity;
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
        if (inside(x, y)) { best.x = x; best.y = y; break; }
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
  }

  updateRope(dt) {
    const r = this.rope;
    if (!r) return;
    const h = this.heroPos();
    const step = L.ropeSpeed * dt;
    if (r.phase === 'out') {
      const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy);
      if (d <= step) { r.x = r.tx; r.y = r.ty; this.landLoop(); } else { r.x += (dx / d) * step; r.y += (dy / d) * step; }
      return;
    }
    if (r.phase === 'back') {
      const dx = h.x - r.x, dy = h.y - r.y, d = Math.hypot(dx, dy);
      if (d <= step) this.rope = null; else { r.x += (dx / d) * step; r.y += (dy / d) * step; }
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
    if ((r.auto && prog >= 1) || (!r.auto && r.tug >= 1)) { this.ropeCatch(e); return; }
    const f = clamp(prog, 0, 1) * 0.85; // stop just short of the hero
    e.x = r.cx + (h.x - r.cx) * f;
    e.y = r.cy + (h.y - r.cy) * f;
    e.facing = h.x < e.x ? 1 : -1; // pulling away from the hero
    r.x = e.x; r.y = e.y;
  }

  /** The rope snaps: the character dashes away from the hero, then bolts for the border. */
  snap(e) {
    const h = this.heroPos();
    const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy) || 1;
    Object.assign(e, { state: 'dash', dashT: L.breakDashTime, pose: null, tx: e.x + (dx / d) * 2, ty: e.y + (dy / d) * 2 });
    this.floater(this.sx(e.x), this.sy(e.y) - 24, tr('lSnapped'), '#ff8a8a', 1);
    this.combo = 0;
    play('leak');
    this.rope.phase = 'back';
    this.rope.target = null;
  }

  ropeCatch(e) {
    this.enemies.splice(this.enemies.indexOf(e), 1);
    this.rope = null;
    const oldMult = this.multiplier();
    if (this.time - this.lastCatch < this.mods.comboWindow) this.combo++; else this.combo = 1;
    this.lastCatch = this.time;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const mult = this.multiplier();
    const isMain = e.def.tier === 1;
    const pts = (isMain ? L.mainPoints : e.def.points) * mult;
    this.score += pts;
    this.stats.caught++;
    if (isMain) this.stats.mains++;
    this.caughtRound += isMain ? L.mainCountsAs : 1;
    this.floater(this.sx(e.x), this.sy(e.y) - 24, `+${fmt(pts)}`, mult > 1 ? '#ffe15a' : '#ffffff', isMain ? 1.6 : 1);
    this.burst(e.x, e.y, e.def.color, isMain ? 40 : 14);
    play(e.def.sound || 'catch', this.combo);
    play(HEROES[this.hero]?.sound || 'kick');
    if (mult > oldMult) sfx.combo();
    if (isMain) { this.shake = 0.4; navigator.vibrate?.([40, 30, 40]); }
    this.cheerT = L.cheerTime;
    if (Math.random() < (isMain ? 1 : CONFIG.powerups.dropChance + this.mods.dropBonus)) {
      const p = this.insidePoint(e, 0.5);
      if (p) this.dropPowerup(p.x, p.y);
    }
    if (e.def.splits) {
      const { into, n } = e.def.splits;
      for (let i = 0; i < n; i++) this.spawn(into[Math.floor(Math.random() * into.length)], this.insidePoint(e, 0.4));
    }
    this.haulAway(e);
    if (this.targetLeft === null && this.caughtRound >= this.target) {
      this.targetLeft = this.roundT;
      this.hooks.onBanner?.(tr('lTargetHit'), tr('lTargetSub'));
    }
  }

  /** Fade a character out, dragged off away from the map centre (reuses the flee effect). */
  haulAway(e) {
    const dx = e.x - DHAKA[0], dy = e.y - DHAKA[1], d = Math.hypot(dx, dy) || 1;
    this.fleeing.push({
      def: e.def, type: e.type, x: this.sx(e.x), y: this.sy(e.y),
      vx: (dx / d) * CONFIG.kick.fleeSpeedPx, vy: (dy / d) * CONFIG.kick.fleeSpeedPx,
      traveled: 0, spin: Math.random() * Math.PI * 2,
    });
  }

  // ---------------------------------------------------------------- input
  onPointer(ev) {
    if (!this.active || this.mode !== 'playing') return;
    ev.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const px = ev.clientX - rect.left, py = ev.clientY - rect.top;
    for (const pu of this.powerups) {
      if (Math.hypot(this.sx(pu.x) - px, this.sy(pu.y) - py) < CONFIG.input.powerupTapRadiusPx) { this.collect(pu); return; }
    }
    if (this.breakT > 0) return;
    const r = this.rope;
    if (r?.phase === 'reel') {
      if (!r.auto) {
        r.tug += L.reelPerTap / this.strength(r.target);
        this.ripple(px, py);
        sfx.hit();
      }
      return;
    }
    if (r) return; // rope still flying
    this.throwRope((px - this.ox) / this.s, (py - this.oy) / this.s);
  }

  // ---------------------------------------------------------------- update
  updatePlay(dt) {
    this.time += dt;
    this.freezeT = Math.max(0, this.freezeT - dt);
    this.wallT = Math.max(0, this.wallT - dt);
    this.cheerT = Math.max(0, this.cheerT - dt);
    if (this.time - this.lastCatch > this.mods.comboWindow) this.combo = 0;

    if (this.breakT > 0) {
      this.breakT -= dt;
      this.updateHero(dt);
      if (this.breakT <= 0) this.nextWave();
      return;
    }
    this.roundT -= dt;
    if (this.roundT <= 0) {
      this.roundT = 0;
      this.endRound();
      return;
    }

    // spawning: keep the map populated up to the cap
    const cap = Math.min(L.maxOnMapCap, Math.floor(L.maxOnMapBase + L.maxOnMapPerRound * (this.wave - 1)));
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.enemies.length + this.warnings.length < cap) {
      this.warn(this.pickType());
      this.spawnT = this.spawnInterval * rand(CONFIG.waves.jitterMin, CONFIG.waves.jitterMax);
    }
    if (this.mainAt !== null && !this.mainThisRound && L.roundTime - this.roundT >= this.mainAt) {
      this.mainThisRound = true;
      this.warn(MAIN_ID);
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

    const frozen = this.freezeT > 0;
    const slow = this.wallT > 0 ? CONFIG.powerups.wallSlow : 1;
    for (const e of [...this.enemies]) {
      e.t += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.hop > 0) e.hop = Math.max(0, e.hop - dt / 0.25);
      if (e.state === 'roped' || frozen) continue;
      let spd = e.speed * slow;
      if (e.state === 'lurk') {
        e.lurkT -= dt;
        if (e.lurkT <= 0) this.startBolt(e);
      } else if (e.state === 'dash') {
        spd *= L.breakDashMul;
        e.dashT -= dt;
        if (e.dashT <= 0) this.startBolt(e);
      }
      if (e.state === 'bolt') spd *= L.boltSpeedMul;
      const tx = e.state === 'lurk' ? e.wx : e.tx;
      const ty = e.state === 'lurk' ? e.wy : e.ty;
      const dx = tx - e.x, dy = ty - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let vx = (dx / d) * spd, vy = (dy / d) * spd;
      if (e.def.wobble) {
        const w = Math.sin(e.t * CONFIG.combat.wobbleFrequency + e.seed) * spd * CONFIG.combat.wobbleAmplitude;
        vx += (-dy / d) * w; vy += (dx / d) * w;
      }
      const nx = e.x + vx * dt, ny = e.y + vy * dt;
      if (e.state === 'lurk') {
        // Lurkers never leave the mainland; pick a new waypoint instead.
        if (!inside(nx, ny) || d < 0.05) { this.pickWaypoint(e); continue; }
      }
      e.x = nx; e.y = ny;
      if (Math.abs(vx) > 0.01) e.facing = vx < 0 ? -1 : 1;
      e.near = e.state === 'lurk' ? Infinity : distToPoly(BD, e.x, e.y);
      if (e.def.summons) {
        e.summonT -= dt;
        if (e.summonT <= 0) {
          e.summonT = Math.max(CONFIG.spawn.summonMinInterval, e.def.summons.every - this.wave * CONFIG.spawn.summonSpeedupPerWave);
          const kinds = e.def.summons.types;
          const p = this.insidePoint(e, CONFIG.spawn.summonSpread);
          if (this.enemies.length < L.maxOnMapCap) this.spawn(kinds[Math.floor(Math.random() * kinds.length)], p);
        }
      }
      if (e.state !== 'lurk' && !inside(e.x, e.y)) {
        this.breach(e);
        if (this.mode !== 'playing') return;
      }
    }
  }

  // ---------------------------------------------------------------- render
  drawHint(t) {
    if (this.mode !== 'playing' || this.stats.caught || this.rope || this.wave !== 1) return;
    const h = this.heroPos();
    this.hintText(tr('lHint'), this.sx(h.x), this.sy(h.y) - L.heroSizePx * 0.8 - Math.abs(Math.sin(t * 6)) * 6);
  }

  drawBossBar() {
    const boss = this.enemies.find((e) => e.def.tier === 1);
    if (!boss || this.mode === 'menu') return;
    const { ctx } = this;
    const r = this.rope;
    const fill = r?.target === boss ? clamp(r.auto ? r.autoT / L.autoReelTime : r.tug, 0, 1) : 1;
    const bw = Math.min(360, this.w - 40), bh = 12;
    const x = (this.w - bw) / 2, y = this.insets.top + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 2, y - 2, bw + 4, bh + 4);
    ctx.fillStyle = r?.target === boss ? '#c9a26b' : '#ffd700';
    ctx.fillRect(x, y, bw * fill, bh);
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.def.emoji} ${tr(`char.${boss.type}`)} · ${tr(r?.target === boss ? 'lReeling' : 'lOnTheLoose')}`, this.w / 2, y + bh / 2 + 1);
  }

  heroSprite(def) {
    const want = this.rope?.phase === 'reel' ? ['pull', 'kick'] : this.rope ? ['throw', 'kick'] : this.cheerT > 0 ? ['cheer'] : ['run'];
    for (const p of want) if (hasAsset(def.sprites?.[p])) return getSprite(def, p);
    return getSprite(def, 'ready');
  }

  drawLayer(t) {
    if (this.mode === 'menu') return;
    const { ctx } = this;
    const def = HEROES[this.hero] || HEROES[Object.keys(HEROES)[0]];
    const size = L.heroSizePx;

    // patrol loop
    ctx.save();
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke(this.patrolPath);
    ctx.restore();

    const h = this.heroPos();
    const hx = this.sx(h.x), hy = this.sy(h.y);
    const running = !this.rope && this.mode === 'playing';
    const bob = running ? Math.abs(Math.sin(t * 12)) * 3 : 0;
    const handX = hx + this.heroFacing * size * 0.22, handY = hy - size * 0.18 - bob;

    // rope + loop
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
      ctx.ellipse(ex, ey, loopR, loopR * 0.6, r.phase === 'out' ? t * 8 % (Math.PI * 2) : 0, 0, Math.PI * 2);
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

    // hero
    const sprite = this.heroSprite(def);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(hx, hy + size * 0.42, size * 0.32, size * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(hx, hy - bob);
    if (sprite) {
      if (this.heroFacing < 0) ctx.scale(-1, 1); // sprites face right
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
