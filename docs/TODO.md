# TODO / known issues

Keep this current: remove items when done (and note them in CHANGELOG.md), add bugs
you notice but don't fix. The longer feature wishlist is in README.md → "Roadmap / ideas".

## Repo / deploy
- [x] `main` branch created and pushed (2026-11-09).
- [ ] Enable GitHub Pages (Settings → Pages → Source: GitHub Actions), then re-run the
      "Deploy to GitHub Pages" workflow. The first run on `main` failed because Pages is off.
- [ ] Optionally make `main` the repo's default branch and retire `claude/modest-bohr-vzpqz0`.

## Known issues / rough edges (found in code review, 2026-11-05)
- [ ] Power-up descriptions in the how-to ("Freezes everyone for 4s") show base values,
      not values boosted by the Cold Storage perk.
- [ ] Gameplay pass 1 (warnings, perks, splitter) not yet balance-tested on a real phone.
- [ ] No automated tests. Pure logic (map geometry, `multiplier`, `isMainWave`, wave
      formulas) could be unit-tested with `node --test` without a build step.
- [ ] `spawnPoint()` can return `null` after 40 tries, silently dropping that intruder
      (wave still clears). Unlikely, but worth knowing when tuning spawn constants.

## Content placeholders (user to decide)
- [ ] Real names / art for tier 2 and tier 3 characters (`js/characters.js`, `char.*` in `js/i18n.js`).
