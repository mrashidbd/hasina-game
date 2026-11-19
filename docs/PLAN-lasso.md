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

## Scoring redesign (2026-11-18): options, waiting for the user's choice
The user wants Rope 'Em! to become the main mode, so its scoring must reward catching Hasina.

### The problem (checked in `js/lasso.js`)
1. **Locking up Hasina ends the run**, so for points the best play is to *never* catch her:
   keep jailing small crooks forever.
2. **Her escape is free.** After `mainStay` (30 s) she slips away, and after `mainCooldown`
   (20 s) she comes back. Nothing is lost.
3. **Difficulty grows with lockups, not with time** (level = lockups / 6). A player who stops
   catching keeps the game easy, so stalling is safe.
4. The only way to lose is 3 sneak-ins. A good player blocks those for a long time.

### Patterns other games use against this
- **Time pressure with a time bonus.** Arcade bosses (Metal Slug, Street Fighter): beating the
  boss sooner scores more, so waiting costs you.
- **A loop of chapters with a growing boss.** Space Invaders and Pac-Man levels: clearing the
  goal starts a harder round instead of ending the game. The score lives in the boss kills.
- **Diminishing returns on side targets.** Small enemies are worth less the longer you farm.
- **A clock the player can't stop.** Difficulty rises with time (Tetris gravity, Fruit Ninja
  Arcade's 60 s), so stalling is never safe.
- **Strikes.** Letting the main target get away is a visible mistake that costs something.

### Options
**A. Chapters (endless, she keeps coming back).** *Recommended.*
- Locking Hasina up **clears the chapter** instead of ending the game.
- She "gets bail", tunnels out of the jail and the next chapter starts harder: more crooks,
  faster sneaks, and she pulls harder.
- Points:
  - Hasina's bounty is `1000 × chapter`;
  - small crooks stay small;
  - a chapter clear adds a time bonus (faster = more).
- **Her escape costs a ❤️.** The run ends at 0 ❤️, like classic mode.
- Why it fits:
  - it is exactly the joke ("they keep trying to come back, we keep sending them back");
  - farming is pointless because the bounty dominates;
  - the share card gets "Jailed Hasina ×4".
- Change: medium.

**B. Deadline + time bonus (one fixed-length run).**
- A visible clock, e.g. 3:00 ("her flight lands in…"). Hasina appears at random times: the
  first time between 0:30 and 1:30, again after every escape.
- Catch her = **win**, with a bonus for the time left (e.g. +20 points per second).
- If the clock runs out she gets in. You lose and keep half your points.
- Why it fits: very easy to understand and to compare scores; stalling only burns your bonus.
- Cons: runs are always short, and the mode gets no "endless" feel.
- Change: small.

**C. Strikes and a shrinking bounty (keeps today's single win).**
- Each escape is a strike, and her bounty drops: 1000 → 600 → 300.
- **3 escapes = she reaches Dhaka = game over.**
- While she is on the map, small crooks score nothing ("catch HER!").
- Difficulty also rises with time, not only with lockups.
- Why it fits: the smallest change to today's rules, and it closes all four loopholes.
- Cons: still one win per run.
- Change: small.

**D. Hype meter (rising pressure).**
- A "She's coming back!" meter fills by itself, and faster over time.
- Lockups push it down a little. When it's full she breaks in: you lose.
- Catch her = win, and a fuller meter at the time of the catch means more points.
- Why it fits: it shows the social-media hype as a game mechanic, and it's very topical.
- Cons: one more HUD element and more to explain, which goes against "simple for all ages".
- Change: medium.

### Extra ways to make it harder (can go with any option)
- **Random timing:** wider random gaps before Hasina appears, and sometimes 2 sneak-ins at once.
- **Decoys:** look-alikes in the same sari. Roping one costs time and combo, and the real one
  has the gold glow.
- **Jailbreak:** a senior leader (e.g. Quader) runs at the jail to free someone; stop him or
  lose your last prisoner.
- **Summons:** while Hasina is on the map, she calls in helpers who stand between her and the
  rope.
- **Combo decay:** the combo window shrinks as the chapter or level rises.
