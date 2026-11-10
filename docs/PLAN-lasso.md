# Plan: "Rope 'Em!" mode (branch `lasso`) — design v2

A second game mode next to the classic one. It uses the same map, roster, heroes, art,
sounds and languages, and the player picks it on the menu. Code: `js/lasso.js`
(`LassoGame extends Game`); tunables: `CONFIG.lasso`.

## Decisions (user)
- 2026-11-10 (v1): a mode in the same game; rope + reel-in (tough crooks are reeled in by
  tapping fast).
- 2026-11-10 (v2 redesign, after playing v1):
  - The hero **circles the centre** (around the lockup at Dhaka), not the border. The rope
    reach is big enough to cover all of Bangladesh. If a tapped crook is out of reach, the
    hero leaves the circle and runs toward it until it is in reach, throws, and then goes
    back to circling.
  - Caught crooks go to a **lockup** (no kicking back to India). Locking up **Hasina = you
    win**.
  - The crooks **lurk outside Bangladesh** (on Indian land) with random movement; the hero
    catches them from inside and brings them in. Hasina and tier 2 are fast, with random,
    erratic paths.
  - **Losing:** now and then a crook **sneaks in** and runs for Dhaka; 3 that get in end the
    run (no timer).
  - **Lockup delivery:** the rope yanks the caught crook through the air into the jail; the
    hero goes straight back to the circle.

## Rules (v2)
1. **Crooks lurk outside.**
   - They wander on Indian land that is visible on screen, never inside Bangladesh.
   - Tier 3 move slowly with gentle turns.
   - Tier 2 and Hasina are fast and erratic: they change direction often, with sharp turns.
   - New crooks appear with a short **!** warning, up to a cap that grows with the level.
2. **Sneak attempts.**
   - Every so often (more often at higher levels), one tier 2/3 lurker sneaks in: it crosses
     the border and runs for Dhaka, with a red ring, a warning sound and a floater.
   - If it reaches the city it **got in**: you lose one of 3 ❤️. At 0 ❤️ the run is over.
   - Sneakers are inside the map, so they are easy to rope. That's the defence.
3. **The hero** circles Dhaka on a small orbit. ⇄ or <kbd>R</kbd> reverses the direction.
4. **Tap** a crook or a spot.
   - In reach → throw at once.
   - Out of reach → the hero runs toward it (following a tapped crook as it moves), throws as
     soon as it is in reach, and then runs back to the orbit.
   - The loop homes in on a tapped crook. It misses if the crook has faded (stealth) or hops
     aside (Taposh).
5. **Reel-in** as in v1: a 1-kick crook is pulled in at once; tougher ones fill a tug meter
   while you tap fast, and the rope snaps if it empties.
6. **Lockup.**
   - A caught crook is flung in an arc into the **jail at Dhaka**, a barred cell that shows
     the latest prisoners' faces and a 🔒 count.
   - **Levels:** every 6 lockups is a level-up (banner): more crooks, faster crooks, more
     sneaking, and new characters unlocking.
7. **Hasina.**
   - She first appears after 12 lockups, at a random moment.
   - She is the fastest crook and pulls hardest, and she never sneaks in.
   - If she isn't caught within ~30 s she slips away (banner) and comes back later.
   - Locking her up = **YOU WIN**: confetti and a victory screen with score, level, time and
     ❤️ left.
8. **Points:**
   - lockup = base points × combo multiplier;
   - Hasina = 1000;
   - win bonus = 500 × ❤️ left;
   - a crook that gets in costs a ❤️ (no points).
9. **Power-ups:** ❄️ Freeze (also stops sneakers), 🧱 Wall (slows everyone), 🛡️ Shield (blocks
   one get-in).

## Visual plan
- **Jail** at Dhaka: a stone-grey rounded box with dark bars, a padlock and a count badge.
  Small prisoner faces (emoji, or the `idle` sprite) sit behind the bars, showing the last 8.
- **Flight into the jail:** the crook spins along a parabola (~0.7 s) and lands with a dust
  burst and a "clunk" (`hit` sound). The jail shakes slightly.
- **Hero orbit:** a faint dashed circle around the jail, and a faint range ring around the
  hero.
- **Chasing:** the hero runs with dust puffs, and a dotted line goes to the target.
- **Sneakers:** a red pulsing ring and a red dashed trail toward Dhaka. The border glows red
  while one is inside.
- **Win:** gold confetti burst, the Hasina face shown big in the jail, and a "YOU WIN!" screen
  (the game-over screen with a gold title).

## Art (optional extra hero poses, fallback to existing)
`run.png` (fallback `ready`), `throw.png` / `pull.png` (fallback `kick`), `cheer` on a
lockup. Enemies: `walk`, `kicked` = being reeled, `idle` = face in the jail.

## Status
- v1 (patrol along the border, timed rounds) was built by Claude on 2026-11-10 and replaced by
  v2.
- v2: written by opencode with GLM-5.3 (`zai-coding-plan/glm-5.3`), then reviewed and tested
  by Claude. See CHANGELOG.
