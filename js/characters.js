// ---------------------------------------------------------------------------
// Character roster. These are PLACEHOLDER (dummy) characters.
// To swap in real artwork later, set `sprite` to an image path
// (e.g. 'assets/boss.png'); it is drawn clipped to the character's circle.
// Speeds are in map units per second (1 unit ≈ 100 km), radius in map units.
// ---------------------------------------------------------------------------
export const CHARACTERS = {
  cadre: {
    name: 'Cadre', emoji: '😠', color: '#d9534f', sprite: null,
    hp: 1, speed: 0.16, radius: 0.1, points: 10, sweepGain: 5, unlock: 1,
  },
  runner: {
    name: 'Runner', emoji: '🏃', color: '#f0a030', sprite: null,
    hp: 1, speed: 0.29, radius: 0.085, points: 20, sweepGain: 6, unlock: 2, wobble: true,
  },
  leader: {
    name: 'Leader', emoji: '😤', color: '#8e5cc4', sprite: null,
    hp: 3, speed: 0.11, radius: 0.13, points: 50, sweepGain: 10, unlock: 3,
  },
  sneaky: {
    name: 'Sneaky', emoji: '🥷', color: '#4a5a6e', sprite: null,
    hp: 1, speed: 0.19, radius: 0.09, points: 30, sweepGain: 7, unlock: 4, stealth: true,
  },
  boss: {
    name: 'Boss', emoji: '👑', color: '#b0202a', sprite: null,
    hp: 12, speed: 0.06, radius: 0.2, points: 250, sweepGain: 30, unlock: 5, summons: true,
  },
};

export const POWERUPS = {
  freeze: { emoji: '❄️', label: 'FREEZE!', color: '#6fd3ff' },
  wall: { emoji: '🧱', label: 'BORDER WALL!', color: '#e0894a' },
  shield: { emoji: '🛡️', label: '+1 SHIELD', color: '#7cffb2' },
  charge: { emoji: '⚡', label: 'SWEEP +40', color: '#ffe15a' },
};

// Preload sprites if any are configured.
for (const c of Object.values(CHARACTERS)) {
  if (c.sprite) {
    const img = new Image();
    img.src = c.sprite;
    c.img = img;
  }
}
