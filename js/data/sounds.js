// Sound catalogue: a `file` (optional, from the asset manifest) plus a
// `synth` fallback name in js/audio.js. File names follow
// docs/prompts/sound-design.md conventions.
import { CHARACTERS } from './enemies.js';
import { HEROES } from './heroes.js';

// Derived from the rosters so a new character automatically gets a sound slot.
const ENEMY_IDS = Object.keys(CHARACTERS);
const HERO_IDS = Object.keys(HEROES);
// Game sounds (sound-design.md §3) and the closest existing synth fallback.
const GAME_SYNTH = {
  hit: 'hit', miss: 'miss', catch: 'catch', combo: 'catch', close: 'power',
  power: 'power', freeze: 'power', wall: 'power', shield: 'shield',
  sweep: 'sweep', wave: 'wave', cleared: 'wave', warn: 'warn',
  boss: 'boss', leak: 'leak', perk: 'power', over: 'over',
  record: 'wave', tap: 'tap',
};

const entry = (file, synth) => ({ file, synth, volume: 1 });

export const SOUNDS = {};
for (const id of ENEMY_IDS) {
  SOUNDS[`enemy_${id}`] = entry(`assets/sfx/enemies/${id}.mp3`, id === 'hasina' ? 'boss' : 'catch');
}
for (const id of HERO_IDS) {
  SOUNDS[`hero_${id}`] = entry(`assets/sfx/heroes/${id}.mp3`, 'kick');
}
for (const [name, synth] of Object.entries(GAME_SYNTH)) {
  SOUNDS[name] = entry(`assets/sfx/game/${name}.mp3`, synth);
}
// Legacy hero-impact fallback (`play(HEROES[hero].sound || 'kick')`).
SOUNDS.kick = { file: null, synth: 'kick', volume: 1 };
