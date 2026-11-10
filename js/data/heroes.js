// Hero roster. Names match the art/sound file names (see docs/prompts/).
import { spritePaths } from './asset-manifest.js';

export const HEROES = {
  farmer: {
    emoji: '👨‍🌾', color: '#7a9e43', sprites: spritePaths('heroes', 'farmer', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), sound: 'hero_farmer',
  },
  studentM: {
    emoji: '👨‍🎓', color: '#4a6fa5', sprites: spritePaths('heroes', 'studentM', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), sound: 'hero_studentM',
  },
  studentF: {
    emoji: '👩‍🎓', color: '#b565a7', sprites: spritePaths('heroes', 'studentF', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), sound: 'hero_studentF',
  },
  common: {
    emoji: '🧑', color: '#c9a227', sprites: spritePaths('heroes', 'common', ['ready', 'kick', 'cheer', 'run', 'throw', 'pull']), sound: 'hero_common',
  },
};
