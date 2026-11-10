# Plan: "Rope 'Em!" mode (branch `lasso`)

A second game mode next to the classic one. It uses the same map, roster, heroes, art, sounds
and languages. The player picks the mode on the menu.

## Decisions (user, 2026-11-10)
- New **mode in the same game** (not a fork), so the character art works in both modes.
- The hero **runs a fixed loop** around the map; timing the throw is the skill.
- **Timed rounds + escapes**: each round has a catch target. Missing the target, or Hasina
  escaping, ends the run.
- **Loop, then reel in**: tough characters pull against the rope; tap fast to drag them in
  before they break free.

## Rules
1. All characters are already **inside Bangladesh**, lurking: each one wanders between random
   waypoints inside the mainland.
2. After a while, each one makes a run for the **India border**. If it crosses, it has
   escaped.
   - Tier 2 escapes cost −200 points; tier 3 escapes cost −50.
   - If **Hasina** escapes, the run is over (a 🛡️ shield drags her back once).
3. The **hero patrols the border**: a smoothed loop just inside the mainland outline, at a
   constant speed. The ⇄ button (or the <kbd>R</kbd> key) reverses the direction.
4. **Tap = throw.** The loop flies from the hero toward the tapped point.
   - The rope has a **limited range**, so characters deep inside can only be caught once
     they head for the border.
   - When the loop arrives it catches the nearest character inside its radius. Otherwise it
     misses, and the rope has to come back before the next throw.
5. **Reel-in.**
   - Tier 3 with 1 HP is pulled in automatically.
   - Tougher characters fill a **tug meter**: every tap adds progress, and the character
     pulls it back down at a rate set by its strength. Full meter = caught; empty meter =
     the rope snaps and the character dashes away.
   - The hero stands still while the rope is out.
6. A **round** lasts 60 s with a catch target of `5 + 2 × round`. Hasina counts as 5 catches.
   Characters keep appearing (with a short ! warning) up to a cap on the map.
7. **Hasina** appears rarely: she has a chance per round from round 2, at most once per round,
   and is guaranteed every 4th round. She is **faster** than everyone else, bolts for the border
   sooner, and pulls hardest. Catching her is worth 1000 points.
8. **Points:**
   - catch = base points × combo multiplier (the same combo rule as classic);
   - round clear = +100 × round;
   - catching with time to spare = +10 per second left once the target is reached.
9. **Power-ups:** ❄️ Freeze, 🧱 Wall (slows everyone) and 🛡️ Shield. Charge is dropped (there
   is no Sweep in this mode). There are no perks in v1 of the mode.
10. **Behaviours carried over:**
    - runners zig-zag;
    - stealth characters flicker, and a loop can't catch them while they are faded;
    - the dodger may jump out of an incoming loop;
    - packs spawn together;
    - organizers and Hasina call in helpers;
    - splitters drop 2 basic leaders when caught.

## Art (optional extra poses, fallback to existing)
- Heroes: `run.png` (fallback `ready`), `throw.png` (fallback `kick`), `pull.png` (fallback
  `kick`). Catch = `cheer`.
- Enemies: `kicked` doubles as "roped and struggling". No new poses are needed.

## Status (2026-11-10)
L1 is done on branch `lasso`, written by Claude (the opencode model `crouton-alpha-free` was
gone; the user chose Claude). It was tested in headless Chromium: catch, reel, snap, Hasina
escape, missed target, round clear, mode switching, phone HUD. Balance has not been
play-tested by a human yet. The rope range was lowered from 2.0 to 1.7 after screenshots.

## Build steps
- **L1 (opencode):**
  - `js/lasso.js` with `LassoGame extends Game`, plus `CONFIG.lasso`;
  - small hooks in `Game`: an `active` flag and a `drawLayer()` hook;
  - mode choice in the menu, a per-mode best score, the HUD (time, caught/target, ⇄), i18n
    en+bn, `sw.js`.
- **L2 (Claude):** review, headless tests of both modes, balance pass, docs.
- **Later:** perks for this mode, an Endless variant, a rope sound set in `sound-design.md`.
