# TODO / known issues

Keep this current: remove items when done (and note them in CHANGELOG.md), add bugs
you notice but don't fix. The longer feature wishlist is in README.md → "Roadmap / ideas".

## Repo / deploy
- [ ] No `main` branch exists on the remote, so the GitHub Pages workflow has never run.
      Decide branch strategy with the user (create `main` from the current branch?).

## Known issues / rough edges (found in code review, 2026-11-05)
- [ ] Leak floater always shows the full penalty (`−200`) even when the score was lower
      and less was actually subtracted (`breach()` in `js/game.js`).
- [ ] Map labels (`INDIA`, `MYANMAR`, `BAY OF BENGAL`, `Dhaka`) are hard-coded English
      on the canvas; they ignore the Bangla setting (`LABELS` in `js/map.js`, `render()`).
- [ ] `breachReason` lower-cases the character name (`main.js renderOver`), which reads
      oddly for proper names like "hasina" in English.
- [ ] High score is only saved on game over; quitting to the menu mid-run discards it.
- [ ] No automated tests. Pure logic (map geometry, `multiplier`, `isMainWave`, wave
      formulas) could be unit-tested with `node --test` without a build step.
- [ ] `spawnPoint()` can return `null` after 40 tries, silently dropping that intruder
      (wave still clears). Unlikely, but worth knowing when tuning spawn constants.

## Content placeholders (user to decide)
- [ ] Real names / art for tier 2 and tier 3 characters (`js/characters.js`, `char.*` in `js/i18n.js`).
