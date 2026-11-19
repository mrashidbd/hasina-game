// Hero roster. Names match the art/sound file names (see docs/prompts/).
import { spritePaths, animPaths } from './asset-manifest.js';

// anims: frame strips for the moving poses (assets/heroes/<id>/<anim>-strip.webp).
const heroAnims = (id) => animPaths('heroes', id, ['kick', 'run', 'throw', 'pull', 'cheer']);

export const HEROES = {
  farmer: {
    emoji: '👨‍🌾', color: '#7a9e43', sprites: spritePaths('heroes', 'farmer', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), anims: heroAnims('farmer'), sound: 'hero_farmer',
  },
  studentM: {
    emoji: '👨‍🎓', color: '#4a6fa5', sprites: spritePaths('heroes', 'studentM', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), anims: heroAnims('studentM'), sound: 'hero_studentM',
  },
  studentF: {
    emoji: '👩‍🎓', color: '#b565a7', sprites: spritePaths('heroes', 'studentF', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), anims: heroAnims('studentF'), sound: 'hero_studentF',
  },
  common: {
    emoji: '🧑', color: '#c9a227', sprites: spritePaths('heroes', 'common', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), anims: heroAnims('common'), sound: 'hero_common',
  },
};
