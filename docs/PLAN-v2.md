# Plan v2 — real roster, heroes that kick, accurate map

Status: **approved 2026-11-09, in progress** (work on branch `v2`; `main` = live site). Update the checkboxes as work lands.

## Goals (from the user)
1. Accurate Bangladesh map.
2. Self characters (heroes): Farmer, Student (male), Student (female), Common People.
   On every tap the chosen hero appears at the tap point and kicks the intruder in the
   backside; the intruder runs back towards India and fades out over ~300 px.
3. Real named roster: Tier 1 Hasina; Tier 2 Obaidul Quader, Nanok, Taposh, Samim Osman,
   Arafat; Tier 3 Saddam, Inan, Siddique Nazmul, Zakir, Shohag, Somrat, Murad, Riyaz,
   Ferdous, Momotaz, Mahiya Mahi.
4. Art prompts (Google Nano Banana, 2–3 reference photos per character, cartoon,
   big head / small body) and sound prompts (ElevenLabs SFX, unique kick sound per character).
5. Architecture where important parameters are easy to change.

## Decisions taken (2026-11-09)
| Topic | Decision |
|---|---|
| Map source | Natural Earth 10m admin-0 (public domain), processed by a script; only the small result is committed |
| Hero | Player picks one hero before each run; that hero does all kicks |
| Art | 2–3 poses per character (enemies: walk, kicked/fleeing, optional idle; heroes: ready, kick). Code adds bob/squash/tilt |
| Sound | ElevenLabs SFX prompts; non-verbal cartoon sounds (no cloning of real people's voices) |
| Workflow | Claude = inspector/PM. Code is written by `opencode` (`opencode/crouton-alpha-free`) and `agy` (`claude-opus-4-6-thinking`, fallback `gemini-3.8-flash-high`); Claude reviews, tests, fixes small issues, sends big ones back |

## Phases

### A. Prompt documents (first, so art/sound can be produced in parallel)
Written by Claude (needs judgment on tone and likeness), reviewed by the user.
- [x] `docs/prompts/enemy-characters.md` — shared style block + one section per enemy:
      role in game, visual exaggerations, outfit/prop, colour, poses, file names.
- [x] `docs/prompts/self-characters.md` — same for the 4 heroes (heroic, likeable).
- [x] `docs/prompts/sound-design.md` — per-enemy kick reaction, hero kick whooshes,
      UI/game sounds, music loop; with duration, format and loudness specs.
- Tone rule: political satire of public persona — cartoon slapstick, no gore, no
  sexualised depictions, no slurs, no invented criminal claims. Likeness comes from the
  reference photos; prompts describe style, exaggeration, outfit and props.

### B. Config & data refactor (foundation) — delegate ✅ done 2026-11-09 (opencode)
- `js/config.js`: every tunable in one place (spawn, speeds, waves, scoring, combo,
  power-ups, perks base values, kick/flee timings, `FLEE_DISTANCE_PX = 300`, hit radius…).
- `js/data/enemies.js`, `js/data/heroes.js`: roster data (tier, stats, behaviour,
  sprite paths per pose, sound id, colour, emoji fallback). Names stay in `i18n.js`.
- `js/data/sounds.js` + `js/assets.js`: manifest + loader. Missing image → emoji
  circle; missing audio → current synth sound. So the game works before art exists.
- Asset layout: `assets/enemies/<id>/{walk,kicked,idle}.png`,
  `assets/heroes/<id>/{ready,kick}.png`, `assets/sfx/<id>.mp3`. `sw.js` ASSETS built
  from the manifest.

### C. Accurate map — script delegated, run + checked by Claude ✅ done 2026-11-09 (opencode, 2 rounds)
- `tools/build-map.mjs`: reads Natural Earth GeoJSON, extracts BD (mainland + major
  islands for drawing), India and Myanmar, simplifies to ~300–500 points, tags each BD
  edge I/M/C by proximity to the neighbour polygons, writes `js/data/map-bd.js`.
- `js/map.js` keeps the same exports (`BD`, `INDIA_EDGES`, `SEA`, `MYANMAR`, …) so
  `game.js` changes are minimal. Check: point-in-polygon perf, spawn logic, visuals.

### D. Kick & flee mechanic + hero select — delegate ✅ done 2026-11-09 (opencode)
- Hero-select screen between menu and play (remembered in localStorage).
- Tap → hero sprite appears behind the intruder, short kick animation (~0.25 s),
  impact burst, per-character kick sound.
- Non-final hit (multi-HP enemies): stumble back. Final hit: intruder switches to
  `fleeing` — runs away from Bangladesh (outward from the border), fades over 300 px,
  can't be tapped and can't breach. Scoring/combo happen at the kick, as today.
- Sweep: all four heroes appear and kick everyone at once.

### E. New roster in game — delegate ✅ done 2026-11-09 (opencode, reviewed)
- 17 characters mapped onto existing behaviours (heavy, dodge, summon, tank, runner,
  stealth, pack, splitter…) with names in both languages; unlock schedule rebalanced
  for 5 tier-2 and 11 tier-3 characters. Exact mapping listed in the enemy prompt doc.

### F. QA (Claude)
- Unit tests with `node --test` (map tagging, wave building, scoring, flee logic).
- Headless Chromium smoke tests at desktop and phone size (scripted in `tools/`),
  screenshots reviewed. Docs + `sw.js` VERSION updated per phase.

## Open items
- User supplies reference photos → generated PNGs/MP3s into `assets/` (names per prompt docs).
